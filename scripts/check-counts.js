import sqlite3 from "sqlite3";

const db = new sqlite3.Database("data/database.sqlite");

const query = (sql) =>
  new Promise((resolve, reject) => {
    db.get(sql, [], (error, row) => {
      if (error) reject(error);
      else resolve(row.c);
    });
  });

const main = async () => {
  const adminUsers = await query("SELECT COUNT(*) AS c FROM admin_users");
  const issues = await query("SELECT COUNT(*) AS c FROM issues");
  const currentIssues = await query("SELECT COUNT(*) AS c FROM issues WHERE status = 'current'");
  const records = await query("SELECT COUNT(*) AS c FROM records");

  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ adminUsers, issues, currentIssues, records }, null, 2));
  db.close();
};

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  db.close();
  process.exit(1);
});
