import fs from "fs";
import path from "path";
import sqlite3 from "sqlite3";

const uploadsIssuesDir = path.resolve("public/uploads/issues");
const db = new sqlite3.Database("data/database.sqlite");

const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

const resolvePdfUrl = (pdfUrl) => {
  if (!pdfUrl || /^https?:\/\//i.test(pdfUrl)) return pdfUrl;

  const fileName = path.basename(pdfUrl);
  const directPath = path.join(uploadsIssuesDir, fileName);
  if (fs.existsSync(directPath)) return `/uploads/issues/${fileName}`;

  const files = fs
    .readdirSync(uploadsIssuesDir)
    .filter((name) => name.toLowerCase().endsWith(".pdf"));
  if (files.length === 0) return pdfUrl;

  const timestampPrefix = fileName.split("-")[0];
  const byTimestamp = files.find((name) => name.startsWith(`${timestampPrefix}-`));
  if (byTimestamp) return `/uploads/issues/${byTimestamp}`;

  const newest = files
    .map((name) => ({
      name,
      mtime: fs.statSync(path.join(uploadsIssuesDir, name)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime)[0];
  return `/uploads/issues/${newest.name}`;
};

const main = async () => {
  const issues = await all(`SELECT id, pdf_url FROM issues`);
  for (const issue of issues) {
    const resolved = resolvePdfUrl(issue.pdf_url);
    if (resolved !== issue.pdf_url) {
      await run(`UPDATE issues SET pdf_url = ? WHERE id = ?`, [resolved, issue.id]);
      console.log(`Updated issue ${issue.id}: ${issue.pdf_url} -> ${resolved}`);
    }
  }
  db.close();
};

main().catch((error) => {
  console.error(error);
  db.close();
  process.exit(1);
});
