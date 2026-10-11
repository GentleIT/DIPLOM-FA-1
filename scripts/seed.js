import "dotenv/config";
import bcrypt from "bcryptjs";
import sqlite3 from "sqlite3";

const db = new sqlite3.Database("data/database.sqlite");

const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

const now = () => new Date().toISOString();

const demoRecords = [
  {
    id: "demo-record-1",
    title: {
      ru: "Самый большой каньон Казахстана",
      kk: "Қазақстанның ең үлкен шатқалы",
      en: "Largest Canyon in Kazakhstan",
    },
    description: {
      ru: "Чарынский каньон признан одним из самых впечатляющих природных объектов.",
      kk: "Шарын шатқалы ең әсерлі табиғи нысандардың бірі ретінде танылды.",
      en: "Charyn Canyon is recognized as one of the most impressive natural sites.",
    },
    category: "geography",
    holder: "ГНПП Чарын",
    location: "Алматинская область",
    date: "2024-06-01",
    image: "https://picsum.photos/id/1015/600/400",
    featured: 1,
  },
  {
    id: "demo-record-2",
    title: {
      ru: "Самый посещаемый туристический объект",
      kk: "Ең көп келетін туристік нысан",
      en: "Most Visited Tourist Attraction",
    },
    description: {
      ru: "Рекордная посещаемость за год среди туристических локаций Казахстана.",
      kk: "Қазақстандағы туристік орындар арасында жылдық рекордтық келушілер саны.",
      en: "Record annual attendance among tourist locations in Kazakhstan.",
    },
    category: "tourism",
    holder: "Нацпарк Бурабай",
    location: "Акмолинская область",
    date: "2024-08-01",
    image: "https://picsum.photos/id/1016/600/400",
    featured: 0,
  },
  {
    id: "demo-record-3",
    title: {
      ru: "Самый быстрый марафонец Казахстана",
      kk: "Қазақстанның ең жылдам марафоншысы",
      en: "Fastest Marathon Runner of Kazakhstan",
    },
    description: {
      ru: "Лучший результат на марафоне с рекордным временем.",
      kk: "Марафондағы рекордтық уақытпен үздік нәтиже.",
      en: "Best marathon result with a record time.",
    },
    category: "sports",
    holder: "Марат Жумабаев",
    location: "Алматы",
    date: "2024-09-05",
    image: "https://picsum.photos/id/102/600/400",
    featured: 0,
  },
];

const seedAdmin = async () => {
  const email = process.env.ADMIN_EMAIL || "admin@example.com";
  const password = process.env.ADMIN_PASSWORD || "admin12345";
  const existing = await get(`SELECT id FROM admin_users WHERE email = ?`, [email]);
  if (existing) return false;
  const hash = await bcrypt.hash(password, 10);
  await run(`INSERT INTO admin_users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)`, [
    crypto.randomUUID(),
    email,
    hash,
    now(),
  ]);
  return true;
};

const seedCurrentIssue = async () => {
  const existing = await get(`SELECT id FROM issues WHERE status = 'current' LIMIT 1`);
  if (existing) return false;
  await run(
    `INSERT INTO issues (id, title, pdf_url, status, updated_at, created_at) VALUES (?, ?, ?, 'current', ?, ?)`,
    [
      crypto.randomUUID(),
      "КИнЭС 2025 (Демо выпуск)",
      "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      now(),
      now(),
    ],
  );
  return true;
};

const seedRecords = async () => {
  let inserted = 0;
  for (const record of demoRecords) {
    const existingById = await get(`SELECT id FROM records WHERE id = ?`, [record.id]);
    if (existingById) continue;
    await run(
      `
      INSERT INTO records (id, title, description, category, holder, location, date, image, featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        record.id,
        JSON.stringify(record.title),
        JSON.stringify(record.description),
        record.category,
        record.holder,
        record.location,
        record.date,
        record.image,
        record.featured,
      ],
    );
    inserted += 1;
  }
  return inserted > 0;
};

const main = async () => {
  const adminAdded = await seedAdmin();
  const issueAdded = await seedCurrentIssue();
  const recordsAdded = await seedRecords();

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        adminAdded,
        currentIssueAdded: issueAdded,
        demoRecordsAdded: recordsAdded,
      },
      null,
      2,
    ),
  );
  db.close();
};

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  db.close();
  process.exit(1);
});
