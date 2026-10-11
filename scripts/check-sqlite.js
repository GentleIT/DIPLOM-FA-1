import sqlite3 from "sqlite3";

const db = new sqlite3.Database("data/database.sqlite");

db.all("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name", [], (error, rows) => {
  if (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    db.close();
    process.exit(1);
  }
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(rows, null, 2));
  db.close();
});
