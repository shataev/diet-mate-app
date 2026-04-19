import Database from 'better-sqlite3'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'diet-mate.db')

let db: Database.Database

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    initSchema(db)
  }
  return db
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY DEFAULT 1,
      calories INTEGER NOT NULL DEFAULT 2000,
      vegetables_g INTEGER NOT NULL DEFAULT 800,
      avocado_g INTEGER NOT NULL DEFAULT 150,
      calcium_mg INTEGER NOT NULL DEFAULT 1000,
      omega3_g REAL NOT NULL DEFAULT 2,
      eggs INTEGER NOT NULL DEFAULT 3,
      seafood_portions INTEGER NOT NULL DEFAULT 3,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    INSERT OR IGNORE INTO goals (id) VALUES (1);

    CREATE TABLE IF NOT EXISTS daily_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      weight_kg REAL,
      steps INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS food_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      food_name TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      omega3_per_100g REAL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS fatsecret_tokens (
      id INTEGER PRIMARY KEY DEFAULT 1,
      access_token TEXT NOT NULL DEFAULT '',
      refresh_token TEXT,
      expires_at INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)
}
