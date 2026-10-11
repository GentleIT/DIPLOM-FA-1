import "dotenv/config";
import fs from "fs";
import path from "path";
import express from "express";
import cors from "cors";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import multer from "multer";
import { all, get, initDb, run } from "./db.js";
import { createToken, parseToken, requireAuth } from "./auth.js";
import { extractPdfTextPages, extractRecordCandidates, resolveLocalIssuePath } from "./pdfRecordsParser.js";

const app = express();
const PORT = Number(process.env.PORT || 3001);
const uploadsRoot = path.resolve(process.cwd(), "public", "uploads");
const issueUploadDir = path.join(uploadsRoot, "issues");
const recordUploadDir = path.join(uploadsRoot, "records");

for (const dir of [uploadsRoot, issueUploadDir, recordUploadDir]) {
  fs.mkdirSync(dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, _file, cb) {
    cb(null, req.uploadTarget === "records" ? recordUploadDir : issueUploadDir);
  },
  filename(_req, file, cb) {
    const safeName = file.originalname.replace(/[^\p{L}\p{N}_.-]+/gu, "-");
    cb(null, `${Date.now()}-${crypto.randomUUID()}-${safeName}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 1500 * 1024 * 1024 } });

app.use(cors({ origin: true }));
app.use(express.json({ limit: "10mb" }));
app.use("/uploads", express.static(uploadsRoot));

const now = () => new Date().toISOString();
const toPublicUploadUrl = (filePath) => `/uploads/${path.relative(uploadsRoot, filePath).replace(/\\/g, "/")}`;
let searchCache = { records: [], pages: [], ready: false };

const parseJsonField = (value) => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const normalizeRecord = (row) => ({
  ...row,
  title: parseJsonField(row.title),
  description: parseJsonField(row.description),
  featured: Boolean(row.featured),
});

const textValue = (value) => {
  const parsed = parseJsonField(value);
  if (typeof parsed === "object" && parsed) return [parsed.ru, parsed.kk, parsed.en].filter(Boolean).join(" ");
  return String(parsed || "");
};

const normalizeSearchText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const compactSearchText = (value) => normalizeSearchText(value).replace(/\s+/g, "");

const matchesQuery = (haystack, query) => {
  const normalizedHaystack = normalizeSearchText(haystack);
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return false;
  return (
    normalizedHaystack.includes(normalizedQuery) ||
    normalizedHaystack.replace(/\s+/g, "").includes(normalizedQuery.replace(/\s+/g, ""))
  );
};

const cacheMatchesQuery = (item, query) => {
  const normalizedQuery = normalizeSearchText(query);
  const compactQuery = compactSearchText(query);
  if (!normalizedQuery) return false;
  return item.searchText.includes(normalizedQuery) || item.compactText.includes(compactQuery);
};

const CATEGORY_KEYWORDS = [
  ["geography", ["географ", "география", "географии", "географию", "geography"]],
  ["population", ["народонасел", "населен", "population", "халық"]],
  ["history", ["история", "истории", "history", "тарих"]],
  ["economy", ["эконом", "бизнес", "economy", "business"]],
  ["politics", ["политик", "politics", "саясат"]],
  ["law", ["право", "закон", "law", "құқық"]],
  ["tourism", ["туризм", "tourism"]],
  ["education", ["образован", "education", "білім"]],
  ["science", ["наука", "science", "ғылым"]],
  ["healthcare", ["здравоохран", "медицин", "healthcare", "денсаулық"]],
  ["culture", ["культур", "искусств", "culture", "art", "өнер"]],
  ["architecture", ["архитект", "градостро", "architecture", "құрылыс"]],
  ["sports", ["спорт", "sports", "sport"]],
];

const detectCategoryFromQuery = (query) => {
  const raw = String(query || "").toLowerCase();
  if (/географ|geography/.test(raw)) return "geography";
  if (/народонасел|населен|population|халық/.test(raw)) return "population";
  if (/истори|history|тарих/.test(raw)) return "history";
  if (/эконом|бизнес|economy|business/.test(raw)) return "economy";
  if (/политик|politics|саясат/.test(raw)) return "politics";
  if (/право|закон|law|құқық/.test(raw)) return "law";
  if (/туризм|tourism/.test(raw)) return "tourism";
  if (/образован|education|білім/.test(raw)) return "education";
  if (/наука|science|ғылым/.test(raw)) return "science";
  if (/здравоохран|медицин|healthcare|денсаулық/.test(raw)) return "healthcare";
  if (/культур|искусств|culture|art|өнер/.test(raw)) return "culture";
  if (/архитект|градостро|architecture|құрылыс/.test(raw)) return "architecture";
  if (/спорт|sport/.test(raw)) return "sports";

  const normalized = normalizeSearchText(query);
  const compact = normalized.replace(/\s+/g, "");
  for (const [category, words] of CATEGORY_KEYWORDS) {
    if (words.some((word) => normalized.includes(word) || compact.includes(word.replace(/\s+/g, "")))) {
      return category;
    }
  }
  return null;
};

const isApplicationIntent = (query) => {
  const raw = String(query || "").toLowerCase();
  return /подат|заявк|отправ|submit|application|record request|өтінім|жіб/.test(raw);
};

const callGemini = async ({ message, language, matches = [] }) => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const context = matches
    .slice(0, 5)
    .map((item) => `- ${item.title}: ${item.snippet || ""}`)
    .join("\n");
  const prompt = [
    "Ты AI-ассистент сайта КИнЭС, Казахстанской книги рекордов.",
    "Отвечай кратко и полезно. Если вопрос про заявку, направляй на страницу /submit.",
    "Если есть локальные результаты, опирайся только на них и не выдумывай.",
    `Язык ответа: ${language}.`,
    context ? `Локальный контекст:\n${context}` : "Локальный контекст не найден.",
    `Вопрос пользователя: ${message}`,
  ].join("\n\n");

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 500 },
        }),
      },
    );
    if (!response.ok) return null;
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim() || null;
  } catch {
    return null;
  }
};

const getLocalizedTitle = (row, language) => {
  const title = parseJsonField(row.title);
  return typeof title === "object" ? title[language] || title.ru || title.en || row.id : title;
};

const makeRecordLink = (row, language) => {
  const label = getLocalizedTitle(row, language);
  return { id: row.id, title: label, url: `/records?q=${encodeURIComponent(label)}` };
};

const makeSearchSnippet = (text, query, before = 55, after = 100) => {
  const normalizedText = normalizeSearchText(text);
  const normalizedQuery = normalizeSearchText(query);
  const normalizedIndex = normalizedText.indexOf(normalizedQuery);
  if (normalizedIndex < 0) return String(text || "").slice(0, before + after).trim();

  const rawText = String(text || "").replace(/\s+/g, " ").trim();
  const ratio = rawText.length / Math.max(normalizedText.length, 1);
  const approxIndex = Math.max(0, Math.floor(normalizedIndex * ratio));
  const start = Math.max(0, approxIndex - before);
  return rawText.slice(start, approxIndex + after).trim();
};

const makeFtsQuery = (query) => {
  const terms = normalizeSearchText(query)
    .split(" ")
    .filter((term) => term.length >= 2)
    .slice(0, 8)
    .map((term) => `"${term.replace(/"/g, '""')}"*`);
  return terms.join(" ");
};

const syncRecordSearchIndex = async (recordId) => {
  const row = await get(`SELECT * FROM records WHERE id = ?`, [recordId]);
  await run(`DELETE FROM records_fts WHERE record_id = ?`, [recordId]);
  if (!row) return;
  await run(
    `INSERT INTO records_fts (record_id, title, description, holder, location, category) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      row.id,
      textValue(row.title),
      textValue(row.description),
      row.holder || "",
      row.location || "",
      row.category || "",
    ],
  );
};

const rebuildSearchIndexes = async (includeFts = false) => {
  const cacheRecords = await all(
    `
    SELECT id, title, description, holder, location, category, source_page, featured, date
    FROM records
    ORDER BY featured DESC, date DESC, created_at DESC
    `,
  );
  const cachePages = await all(
    `
    SELECT issue_pages.issue_id, issue_pages.page, issue_pages.text, issues.title, issues.pdf_url, issues.created_at
    FROM issue_pages
    JOIN issues ON issues.id = issue_pages.issue_id
    ORDER BY issues.created_at DESC, issue_pages.page ASC
    `,
  );
  searchCache = {
    records: cacheRecords.map((row) => {
      const title = textValue(row.title);
      const description = textValue(row.description);
      const searchText = normalizeSearchText(`${title} ${description} ${row.holder || ""} ${row.location || ""} ${row.category || ""}`);
      return {
        ...row,
        displayTitle: title,
        displayDescription: description,
        searchText,
        compactText: searchText.replace(/\s+/g, ""),
      };
    }),
    pages: cachePages.map((row) => {
      const searchText = normalizeSearchText(`${row.title || ""} ${row.text || ""}`);
      return {
        ...row,
        searchText,
        compactText: searchText.replace(/\s+/g, ""),
      };
    }),
    ready: true,
  };

  if (!includeFts) return;

  await run(`DELETE FROM records_fts`);
  await run(`DELETE FROM issue_pages_fts`);

  for (const row of cacheRecords) {
    await run(
      `INSERT INTO records_fts (record_id, title, description, holder, location, category) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        row.id,
        textValue(row.title),
        textValue(row.description),
        row.holder || "",
        row.location || "",
        row.category || "",
      ],
    );
  }

  for (const page of cachePages) {
    await run(
      `INSERT INTO issue_pages_fts (issue_id, page, issue_title, text) VALUES (?, ?, ?, ?)`,
      [page.issue_id, page.page, page.title || "", page.text || ""],
    );
  }
};

const stringifyLocalized = (value) => {
  if (typeof value === "string") return value;
  return JSON.stringify(value || { ru: "", kk: "", en: "" });
};

const recordPayloadFromRequest = (req) => {
  const payload = req.body?.data ? JSON.parse(req.body.data) : req.body;
  if (req.file) payload.image = toPublicUploadUrl(req.file.path);
  return payload;
};

const saveRecord = async (payload, source = {}) => {
  const id = payload.id || crypto.randomUUID();
  await run(
    `
    INSERT INTO records (id, title, description, category, holder, location, date, image, featured, source_issue_id, source_page, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      description = excluded.description,
      category = excluded.category,
      holder = excluded.holder,
      location = excluded.location,
      date = excluded.date,
      image = excluded.image,
      featured = excluded.featured,
      source_issue_id = COALESCE(excluded.source_issue_id, records.source_issue_id),
      source_page = COALESCE(excluded.source_page, records.source_page)
    `,
    [
      id,
      stringifyLocalized(payload.title),
      stringifyLocalized(payload.description),
      payload.category || "history",
      payload.holder || "",
      payload.location || "",
      payload.date || "",
      payload.image || "/placeholder.svg",
      payload.featured ? 1 : 0,
      source.issueId || payload.source_issue_id || null,
      source.page || payload.source_page || null,
      now(),
    ],
  );
  await syncRecordSearchIndex(id);
  return id;
};

const parseIssuePdf = async (issueId) => {
  const issue = await get(`SELECT * FROM issues WHERE id = ?`, [issueId]);
  if (!issue) {
    const error = new Error("Issue not found");
    error.status = 404;
    throw error;
  }

  const filePath = resolveLocalIssuePath(issue.pdf_url);
  if (!filePath) {
    const error = new Error("PDF is not a local uploaded file");
    error.status = 400;
    throw error;
  }

  const pages = await extractPdfTextPages(filePath);
  await run(`DELETE FROM issue_pages WHERE issue_id = ?`, [issueId]);
  await run(`DELETE FROM issue_pages_fts WHERE issue_id = ?`, [issueId]);
  await run(`DELETE FROM records WHERE source_issue_id = ?`, [issueId]);
  await run(`DELETE FROM records_fts WHERE record_id NOT IN (SELECT id FROM records)`);

  for (const page of pages) {
    if (page.text) {
      await run(`INSERT INTO issue_pages (issue_id, page, text) VALUES (?, ?, ?)`, [issueId, page.page, page.text]);
      await run(`INSERT INTO issue_pages_fts (issue_id, page, issue_title, text) VALUES (?, ?, ?, ?)`, [
        issueId,
        page.page,
        issue.title,
        page.text,
      ]);
    }
  }

  const candidates = extractRecordCandidates(pages, issue.title);
  for (const item of candidates) {
    await saveRecord(
      {
        title: { ru: item.title, kk: "", en: "" },
        description: { ru: item.description, kk: "", en: "" },
        category: item.category,
        holder: item.holder,
        location: item.location,
        date: item.date,
        image: item.image,
        featured: false,
      },
      { issueId, page: item.sourcePage },
    );
  }

  await run(`UPDATE issues SET parsed_at = ?, extracted_records_count = ?, updated_at = ? WHERE id = ?`, [
    now(),
    candidates.length,
    now(),
    issueId,
  ]);
  await rebuildSearchIndexes();

  return { issueId, pages: pages.length, records: candidates.length };
};

const searchLocal = async (query, limit = 8) => {
  const ftsQuery = makeFtsQuery(query);
  if (!ftsQuery) return [];

  if (searchCache.ready) {
    const records = searchCache.records.filter((item) => cacheMatchesQuery(item, query)).slice(0, limit);
    const pages = searchCache.pages.filter((item) => cacheMatchesQuery(item, query)).slice(0, limit);
    return [
      ...records.map((item) => ({
        title: item.displayTitle,
        url: `/records`,
        snippet: item.displayDescription,
        source: item.source_page ? `page ${item.source_page}` : "record",
      })),
      ...pages.map((item) => {
        const index = item.searchText.indexOf(normalizeSearchText(query));
        const approxStart = Math.max(0, index - 90);
        return {
          title: `${item.title}, page ${item.page}`,
          url: `${item.pdf_url}#page=${item.page}`,
          snippet: item.text.slice(approxStart, approxStart + 240),
          source: "pdf",
        };
      }),
    ].slice(0, limit);
  }

  let records = [];
  let pages = [];
  try {
    records = await all(
      `
      SELECT records.id, records.title, records.description, records.holder, records.source_page,
             bm25(records_fts) AS rank
      FROM records_fts
      JOIN records ON records.id = records_fts.record_id
      WHERE records_fts MATCH ?
      ORDER BY rank, records.featured DESC, records.date DESC
      LIMIT ?
      `,
      [ftsQuery, limit],
    );
    pages = await all(
      `
      SELECT issue_pages_fts.issue_id, issue_pages_fts.page, issue_pages_fts.text, issues.title, issues.pdf_url,
             bm25(issue_pages_fts) AS rank
      FROM issue_pages_fts
      JOIN issues ON issues.id = issue_pages_fts.issue_id
      WHERE issue_pages_fts MATCH ?
      ORDER BY rank
      LIMIT ?
      `,
      [ftsQuery, limit],
    );
  } catch {
    records = [];
    pages = [];
  }

  if (records.length === 0 && pages.length === 0) {
    records = (await all(
      `SELECT id, title, description, holder, location, source_page FROM records ORDER BY featured DESC, date DESC LIMIT 3000`,
    ))
      .filter((item) => matchesQuery(`${textValue(item.title)} ${textValue(item.description)} ${item.holder || ""} ${item.location || ""}`, query))
      .slice(0, limit);
  }

  return [
    ...records.map((item) => ({
      title: textValue(item.title),
      url: `/records`,
      snippet: textValue(item.description),
      source: item.source_page ? `page ${item.source_page}` : "record",
    })),
    ...pages.map((item) => {
      const index = item.text.toLowerCase().indexOf(query.toLowerCase());
      const start = Math.max(0, index - 90);
      return {
    title: `${item.title}, page ${item.page}`,
    url: `${item.pdf_url}#page=${item.page}`,
        snippet: item.text.slice(start, start + 240),
        source: "pdf",
      };
    }),
  ].slice(0, limit);
};

// Admin users
app.get("/api/admin/users", requireAuth, async (_req, res) => {
  try {
    const rows = await all(`SELECT id, email, created_at FROM admin_users ORDER BY created_at ASC`);
    res.json(rows);
  } catch (_err) {
    res.status(500).json({ error: "Ошибка при получении пользователей" });
  }
});

app.post("/api/admin/users", requireAuth, async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (!email || !password || password.length < 6) {
      return res.status(400).json({ error: "Email и пароль минимум 6 символов обязательны" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const id = crypto.randomUUID();
    const createdAt = now();
    await run(`INSERT INTO admin_users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)`, [
      id,
      email,
      passwordHash,
      createdAt,
    ]);
    res.status(201).json({ id, email, created_at: createdAt });
  } catch (err) {
    if (String(err.message).includes("UNIQUE")) {
      return res.status(400).json({ error: "Пользователь с таким email уже существует" });
    }
    res.status(500).json({ error: "Не удалось создать пользователя" });
  }
});

app.delete("/api/admin/users/:id", requireAuth, async (req, res) => {
  try {
    if (req.params.id === req.auth.userId) {
      return res.status(400).json({ error: "Нельзя удалить свой аккаунт" });
    }
    const countData = await get(`SELECT COUNT(*) as count FROM admin_users`);
    if (countData.count <= 1) return res.status(400).json({ error: "Нельзя удалить последнего администратора" });
    const result = await run(`DELETE FROM admin_users WHERE id = ?`, [req.params.id]);
    if (result.changes === 0) return res.status(404).json({ error: "Пользователь не найден" });
    res.json({ success: true });
  } catch (_err) {
    res.status(500).json({ error: "Ошибка при удалении" });
  }
});

// Auth
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await get(`SELECT * FROM admin_users WHERE email = ?`, [String(email || "").toLowerCase()]);
  if (!user || !(await bcrypt.compare(String(password || ""), user.password_hash))) {
    return res.status(401).json({ error: "Неверный логин или пароль" });
  }
  res.json({ token: createToken(user), user: { id: user.id, email: user.email } });
});

app.get("/api/auth/session", (req, res) => {
  const payload = parseToken(req);
  if (!payload) return res.status(401).json({ error: "Unauthorized" });
  res.json({ user: { id: payload.userId, email: payload.email } });
});

// Records
app.get("/api/records", async (_req, res) => {
  const query = String(_req.query.q || "").trim();
  const category = String(_req.query.category || "all");
  const limit = Math.min(Number(_req.query.limit || 0) || 0, 300);
  const params = [];
  let sql = `SELECT * FROM records`;
  const where = [];

  if (category && category !== "all") {
    where.push(`category = ?`);
    params.push(category);
  }

  if (query) {
    const matchedIds = searchCache.ready
      ? searchCache.records
          .filter((item) => (category === "all" || item.category === category) && cacheMatchesQuery(item, query))
          .slice(0, limit || 120)
          .map((item) => item.id)
      : [];

    if (matchedIds.length === 0) return res.json([]);
    where.push(`id IN (${matchedIds.map(() => "?").join(",")})`);
    params.push(...matchedIds);
  }

  if (where.length) sql += ` WHERE ${where.join(" AND ")}`;
  sql += ` ORDER BY featured DESC, date DESC, created_at DESC`;
  if (limit || query) {
    sql += ` LIMIT ?`;
    params.push(limit || 120);
  }

  const rows = await all(sql, params);
  res.json(rows.map(normalizeRecord));
});

app.post("/api/records", requireAuth, (req, res, next) => {
  req.uploadTarget = "records";
  upload.single("image")(req, res, next);
}, async (req, res) => {
  try {
    const payload = recordPayloadFromRequest(req);
    if (!payload.title || !payload.description) return res.status(400).json({ error: "Название и описание обязательны" });
    const id = await saveRecord(payload);
    await rebuildSearchIndexes();
    const row = await get(`SELECT * FROM records WHERE id = ?`, [id]);
    res.status(201).json(normalizeRecord(row));
  } catch (err) {
    res.status(500).json({ error: err.message || "Не удалось сохранить рекорд" });
  }
});

app.delete("/api/records/:id", requireAuth, async (req, res) => {
  const result = await run(`DELETE FROM records WHERE id = ?`, [req.params.id]);
  if (result.changes === 0) return res.status(404).json({ error: "Рекорд не найден" });
  await run(`DELETE FROM records_fts WHERE record_id = ?`, [req.params.id]);
  await rebuildSearchIndexes();
  res.json({ success: true });
});

// Applications
app.get("/api/applications", requireAuth, async (req, res) => {
  const params = [];
  let sql = `SELECT * FROM applications`;
  if (req.query.status) {
    sql += ` WHERE status = ?`;
    params.push(req.query.status);
  }
  sql += ` ORDER BY created_at DESC`;
  res.json(await all(sql, params));
});

app.post("/api/applications", (req, res, next) => {
  req.uploadTarget = "records";
  upload.single("image")(req, res, next);
}, async (req, res) => {
  try {
    const id = crypto.randomUUID();
    const image = req.file ? toPublicUploadUrl(req.file.path) : "";
    await run(
      `INSERT INTO applications (id, title, description, category, date, holder, location, status, image, submitteremail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
      [
        id,
        req.body.title || "",
        req.body.description || "",
        req.body.category || "history",
        req.body.date || "",
        req.body.holder || "",
        req.body.location || "",
        image,
        req.body.submitteremail || "",
        now(),
      ],
    );
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message || "Не удалось отправить заявку" });
  }
});

app.patch("/api/applications/:id", requireAuth, async (req, res) => {
  await run(`UPDATE applications SET status = ? WHERE id = ?`, [req.body.status || "pending", req.params.id]);
  res.json({ success: true });
});

app.delete("/api/applications/:id", requireAuth, async (req, res) => {
  await run(`DELETE FROM applications WHERE id = ?`, [req.params.id]);
  res.json({ success: true });
});

// Issues
app.get("/api/issues", async (req, res) => {
  const params = [];
  let sql = `SELECT * FROM issues`;
  if (req.query.status) {
    sql += ` WHERE status = ?`;
    params.push(req.query.status);
  }
  sql += ` ORDER BY status = 'current' DESC, created_at DESC`;
  res.json(await all(sql, params));
});

app.post("/api/issues", requireAuth, (req, res, next) => {
  req.uploadTarget = "issues";
  upload.single("pdf")(req, res, next);
}, async (req, res) => {
  try {
    const id = crypto.randomUUID();
    const createdAt = now();
    const title = String(req.body.title || "").trim();
    const pdfUrl = req.file ? toPublicUploadUrl(req.file.path) : String(req.body.pdf_url || "").trim();
    const status = req.body.status === "current" ? "current" : "archive";
    if (!title || !pdfUrl) return res.status(400).json({ error: "Название и PDF обязательны" });

    if (status === "current") await run(`UPDATE issues SET status = 'archive', updated_at = ? WHERE status = 'current'`, [createdAt]);
    await run(
      `INSERT INTO issues (id, title, pdf_url, status, updated_at, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, title, pdfUrl, status, createdAt, createdAt],
    );

    let parseResult = null;
    if (req.file) {
      try {
        parseResult = await parseIssuePdf(id);
      } catch (error) {
        parseResult = { error: error.message };
      }
    }

    const issue = await get(`SELECT * FROM issues WHERE id = ?`, [id]);
    res.status(201).json({ ...issue, parseResult });
  } catch (err) {
    res.status(500).json({ error: err.message || "Не удалось добавить выпуск" });
  }
});

app.post("/api/issues/:id/parse", requireAuth, async (req, res) => {
  try {
    res.json(await parseIssuePdf(req.params.id));
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "Не удалось распарсить PDF" });
  }
});

app.patch("/api/issues/:id/status", requireAuth, async (req, res) => {
  const status = req.body.status === "current" ? "current" : "archive";
  if (status === "current") await run(`UPDATE issues SET status = 'archive', updated_at = ? WHERE status = 'current'`, [now()]);
  await run(`UPDATE issues SET status = ?, updated_at = ? WHERE id = ?`, [status, now(), req.params.id]);
  res.json({ success: true });
});

app.delete("/api/issues/:id", requireAuth, async (req, res) => {
  const issue = await get(`SELECT * FROM issues WHERE id = ?`, [req.params.id]);
  await run(`DELETE FROM issue_pages WHERE issue_id = ?`, [req.params.id]);
  await run(`DELETE FROM issue_pages_fts WHERE issue_id = ?`, [req.params.id]);
  await run(`DELETE FROM records WHERE source_issue_id = ?`, [req.params.id]);
  await run(`DELETE FROM records_fts WHERE record_id NOT IN (SELECT id FROM records)`);
  await run(`DELETE FROM issues WHERE id = ?`, [req.params.id]);
  const filePath = issue ? resolveLocalIssuePath(issue.pdf_url) : null;
  if (filePath) fs.promises.unlink(filePath).catch(() => {});
  await rebuildSearchIndexes();
  res.json({ success: true });
});

app.get("/api/issues/search", async (req, res) => {
  const query = String(req.query.q || "").trim();
  const issueId = String(req.query.issue_id || "").trim();
  const pdfUrl = String(req.query.pdf_url || "").trim();
  const limit = Math.min(Number(req.query.limit || 80) || 80, 120);

  if (query.length < 2) return res.json({ results: [] });

  let issue = null;
  if (issueId) {
    issue = await get(`SELECT * FROM issues WHERE id = ?`, [issueId]);
  } else if (pdfUrl) {
    issue = await get(`SELECT * FROM issues WHERE pdf_url = ?`, [pdfUrl]);
  }

  if ((issueId || pdfUrl) && !issue) return res.status(404).json({ error: "Выпуск не найден" });

  const pages = searchCache.ready
    ? searchCache.pages
        .filter((page) => (!issue || page.issue_id === issue.id) && cacheMatchesQuery(page, query))
        .slice(0, limit)
    : [];

  if (pages.length > 0) {
    return res.json({
      issueId: issue?.id || null,
      results: pages.map((page) => ({
        issueId: page.issue_id,
        issueTitle: page.title,
        pdfUrl: page.pdf_url,
        page: page.page,
        text: `...${makeSearchSnippet(page.text, query)}...`,
      })),
    });
  }

  const rowsSql = issue
    ? `
      SELECT issue_pages.issue_id, issues.title AS issueTitle, issues.pdf_url AS pdfUrl, issue_pages.page, issue_pages.text
      FROM issue_pages
      JOIN issues ON issues.id = issue_pages.issue_id
      WHERE issue_pages.issue_id = ?
      ORDER BY issue_pages.page ASC
      `
    : `
      SELECT issue_pages.issue_id, issues.title AS issueTitle, issues.pdf_url AS pdfUrl, issue_pages.page, issue_pages.text
      FROM issue_pages
      JOIN issues ON issues.id = issue_pages.issue_id
      ORDER BY issues.created_at DESC, issue_pages.page ASC
      `;
  const rows = (await all(rowsSql, issue ? [issue.id] : []))
    .filter((page) => matchesQuery(page.text, query))
    .slice(0, limit);

  res.json({
    issueId: issue?.id || null,
    results: rows.map((page) => ({
      issueId: page.issue_id,
      issueTitle: page.issueTitle,
      pdfUrl: page.pdfUrl,
      page: page.page,
      text: `...${makeSearchSnippet(page.text, query)}...`,
    })),
  });
});

// Search and assistant
app.get("/api/search/instant", async (req, res) => {
  const query = String(req.query.q || "").trim();
  if (query.length < 2) return res.json({ results: [] });

  const local = await searchLocal(query, 8);
  if (local.length > 0) return res.json({ results: local, scope: "local" });

  try {
    const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
    const data = await response.json();
    const topics = [...(data.RelatedTopics || [])].flatMap((item) => item.Topics || [item]);
    const results = topics
      .filter((item) => item.FirstURL && item.Text)
      .slice(0, 6)
      .map((item) => ({ title: item.Text.split(" - ")[0], url: item.FirstURL, snippet: item.Text, source: "web" }));
    res.json({ results, scope: "global" });
  } catch {
    res.json({ results: [], scope: "global" });
  }
});

app.post("/api/assistant/chat", async (req, res) => {
  const message = String(req.body.message || "").trim();
  const language = req.body.language || "ru";
  if (!message) return res.status(400).json({ error: "Message is required" });

  if (isApplicationIntent(message)) {
    const reply =
      language === "en"
        ? "You can submit a record application on the application page. Open the link below and fill in the form."
        : "Подать заявку можно на отдельной странице. Откройте ссылку ниже и заполните форму рекорда.";
    return res.json({
      reply,
      relevantLinks: [{ id: "submit-application", title: language === "en" ? "Submit application" : "Подать заявку", url: "/submit" }],
    });
  }

  const requestedCategory = detectCategoryFromQuery(message);
  if (requestedCategory) {
    const categoryRecords = await all(
      `SELECT id, title, description FROM records WHERE category = ? ORDER BY featured DESC, date DESC, created_at DESC LIMIT 6`,
      [requestedCategory],
    );
    const links = categoryRecords.map((row) => makeRecordLink(row, language));
    const reply =
      language === "en"
        ? `I found records in this category. Open any card below.`
        : `Нашел рекорды в категории. Откройте нужную карточку ниже.`;
    return res.json({ reply, relevantLinks: links });
  }

  const matches = await searchLocal(message, 4);
  const records = await all(`SELECT id, title, description FROM records ORDER BY featured DESC, date DESC LIMIT 4`);
  const links = records.map((row) => makeRecordLink(row, language));

  if (matches.length > 0) {
    const geminiReply = await callGemini({ message, language, matches });
    const reply = geminiReply || (language === "en"
        ? `I found this in the local records base:\n\n${matches.slice(0, 3).map((item) => `- ${item.title}: ${item.snippet}`).join("\n")}`
        : `Нашел в локальной базе рекордов:\n\n${matches.slice(0, 3).map((item) => `- ${item.title}: ${item.snippet}`).join("\n")}`);
    return res.json({ reply, relevantLinks: links });
  }

  const geminiReply = await callGemini({ message, language, matches: [] });
  const fallback = geminiReply || (language === "en"
      ? "I did not find an exact match in the local records base. Try a shorter phrase, a person name, place, or record category."
      : "Точного совпадения в локальной базе рекордов не нашлось. Попробуйте короткую фразу, имя, место или категорию рекорда.");
  res.json({ reply: fallback, relevantLinks: links });
});

app.use((req, res) => {
  if (req.originalUrl.startsWith("/api")) {
    return res.status(404).json({ error: `Маршрут ${req.originalUrl} не найден на сервере` });
  }
  res.status(404).send("Not found");
});

async function startServer() {
  try {
    await initDb();
    await rebuildSearchIndexes();
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`[api] Server started at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Startup error:", err);
  }
}

startServer();
