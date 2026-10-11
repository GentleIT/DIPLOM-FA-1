import "dotenv/config";
import fs from "fs";
import path from "path";
import sqlite3 from "sqlite3";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  // eslint-disable-next-line no-console
  console.error(
    "Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY).",
  );
  process.exit(1);
}

const dataDir = path.resolve(process.cwd(), "data");
const dbPath = path.join(dataDir, "database.sqlite");
const uploadsDir = path.resolve(process.cwd(), "public", "uploads");
const appUploadsDir = path.join(uploadsDir, "applications");
const issueUploadsDir = path.join(uploadsDir, "issues");

for (const dir of [dataDir, uploadsDir, appUploadsDir, issueUploadsDir]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

const allRows = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

const supabaseSelect = async (table, select = "*") => {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}`;
  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase select failed for ${table}: ${response.status} ${text}`);
  }
  return response.json();
};

const safeFileName = (raw) => raw.replace(/[^\w.-]+/g, "-");

const downloadFileIfPublic = async (url, targetDir, prefix = "file") => {
  if (!url || !/^https?:\/\//i.test(url)) return url || "";
  try {
    const fileNameFromUrl = safeFileName(url.split("/").pop() || `${prefix}.bin`);
    const fileName = `${Date.now()}-${fileNameFromUrl}`;
    const targetPath = path.join(targetDir, fileName);
    const response = await fetch(url);
    if (!response.ok) return url;
    const arrayBuffer = await response.arrayBuffer();
    fs.writeFileSync(targetPath, Buffer.from(arrayBuffer));
    const relativeRoot = targetDir === appUploadsDir ? "applications" : "issues";
    return `/uploads/${relativeRoot}/${fileName}`;
  } catch (_error) {
    return url;
  }
};

const ensureSchema = async () => {
  await run(`
    CREATE TABLE IF NOT EXISTS records (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      holder TEXT NOT NULL,
      location TEXT,
      date TEXT,
      image TEXT,
      featured INTEGER NOT NULL DEFAULT 0
    );
  `);
  await run(`
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT,
      date TEXT,
      holder TEXT NOT NULL,
      location TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      image TEXT,
      submitteremail TEXT,
      created_at TEXT NOT NULL
    );
  `);
  await run(`
    CREATE TABLE IF NOT EXISTS issues (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      pdf_url TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'archive',
      updated_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
  await run(`
    CREATE TABLE IF NOT EXISTS page_content (
      path TEXT PRIMARY KEY,
      html TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
};

const normalizeJsonText = (value) => {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return JSON.stringify({});
  return JSON.stringify(value);
};

const migrateRecords = async () => {
  const rows = await supabaseSelect("records");
  for (const row of rows) {
    const imageLocal = await downloadFileIfPublic(row.image, appUploadsDir, "record-image");
    await run(
      `
        INSERT INTO records (id, title, description, category, holder, location, date, image, featured)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          description = excluded.description,
          category = excluded.category,
          holder = excluded.holder,
          location = excluded.location,
          date = excluded.date,
          image = excluded.image,
          featured = excluded.featured
      `,
      [
        row.id,
        normalizeJsonText(row.title),
        normalizeJsonText(row.description),
        row.category || "",
        row.holder || "",
        row.location || "",
        row.date || "",
        imageLocal || "",
        row.featured ? 1 : 0,
      ],
    );
  }
  return rows.length;
};

const migrateApplications = async () => {
  const rows = await supabaseSelect("applications");
  for (const row of rows) {
    const imageLocal = await downloadFileIfPublic(row.image, appUploadsDir, "application-image");
    await run(
      `
        INSERT INTO applications (id, title, description, category, date, holder, location, status, image, submitteremail, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          description = excluded.description,
          category = excluded.category,
          date = excluded.date,
          holder = excluded.holder,
          location = excluded.location,
          status = excluded.status,
          image = excluded.image,
          submitteremail = excluded.submitteremail,
          created_at = excluded.created_at
      `,
      [
        row.id,
        row.title || "",
        row.description || "",
        row.category || "",
        row.date || "",
        row.holder || "",
        row.location || "",
        row.status || "pending",
        imageLocal || "",
        row.submitteremail || "",
        row.created_at || new Date().toISOString(),
      ],
    );
  }
  return rows.length;
};

const migrateIssues = async () => {
  const rows = await supabaseSelect("issues");
  for (const row of rows) {
    const pdfLocal = await downloadFileIfPublic(row.pdf_url, issueUploadsDir, "issue");
    await run(
      `
        INSERT INTO issues (id, title, pdf_url, status, updated_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          pdf_url = excluded.pdf_url,
          status = excluded.status,
          updated_at = excluded.updated_at,
          created_at = excluded.created_at
      `,
      [
        row.id,
        row.title || "",
        pdfLocal || row.pdf_url || "",
        row.status || "archive",
        row.updated_at || new Date().toISOString(),
        row.created_at || new Date().toISOString(),
      ],
    );
  }
  return rows.length;
};

const migratePageContent = async () => {
  const rows = await supabaseSelect("page_content");
  for (const row of rows) {
    await run(
      `
        INSERT INTO page_content (path, html, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(path) DO UPDATE SET
          html = excluded.html,
          updated_at = excluded.updated_at
      `,
      [row.path || "/", row.html || "", row.updated_at || new Date().toISOString()],
    );
  }
  return rows.length;
};

const main = async () => {
  await ensureSchema();

  const countRecordsBefore = (await allRows(`SELECT id FROM records`)).length;
  const countApplicationsBefore = (await allRows(`SELECT id FROM applications`)).length;
  const countIssuesBefore = (await allRows(`SELECT id FROM issues`)).length;
  const countPagesBefore = (await allRows(`SELECT path FROM page_content`)).length;

  const migratedRecords = await migrateRecords();
  const migratedApplications = await migrateApplications();
  const migratedIssues = await migrateIssues();
  const migratedPages = await migratePageContent();

  const countRecordsAfter = (await allRows(`SELECT id FROM records`)).length;
  const countApplicationsAfter = (await allRows(`SELECT id FROM applications`)).length;
  const countIssuesAfter = (await allRows(`SELECT id FROM issues`)).length;
  const countPagesAfter = (await allRows(`SELECT path FROM page_content`)).length;

  // eslint-disable-next-line no-console
  console.log("Migration complete:");
  // eslint-disable-next-line no-console
  console.log(`records: ${migratedRecords} fetched | ${countRecordsBefore} -> ${countRecordsAfter}`);
  // eslint-disable-next-line no-console
  console.log(`applications: ${migratedApplications} fetched | ${countApplicationsBefore} -> ${countApplicationsAfter}`);
  // eslint-disable-next-line no-console
  console.log(`issues: ${migratedIssues} fetched | ${countIssuesBefore} -> ${countIssuesAfter}`);
  // eslint-disable-next-line no-console
  console.log(`page_content: ${migratedPages} fetched | ${countPagesBefore} -> ${countPagesAfter}`);

  db.close();
};

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  db.close();
  process.exit(1);
});
