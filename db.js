const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./tickets.db");

// Create tickets table
db.run(`CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  created_at DATETIME NOT NULL,
  status TEXT NOT NULL,
  status_updated_at DATETIME NOT NULL,
  claimed_by_id TEXT,
  claimed_by_name TEXT
)`);

// Create dommere table
db.run(`CREATE TABLE IF NOT EXISTS dommere (
  user_id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL,
  kategori_id TEXT NOT NULL
)`);

module.exports = db;
