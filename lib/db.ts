import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const DB_PATH = path.join(process.cwd(), 'data', 'yeweihui.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Allow other processes to wait up to 5 seconds if DB is locked
db.pragma('busy_timeout = 5000');

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('meeting', 'announcement', 'government', 'rights')),
    event_date TEXT NOT NULL,
    description TEXT,
    participants TEXT,
    created_at DATETIME DEFAULT (datetime('now', 'localtime')),
    updated_at DATETIME DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    record_id INTEGER NOT NULL REFERENCES records(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    created_at DATETIME DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS members (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    role       TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    username   TEXT NOT NULL UNIQUE,
    password   TEXT NOT NULL,
    role       TEXT NOT NULL CHECK(role IN ('admin','member')) DEFAULT 'member',
    created_at DATETIME DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS counterparties (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS contracts (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    title        TEXT NOT NULL,
    counterparty TEXT NOT NULL,
    type         TEXT NOT NULL CHECK(type IN ('maintenance','management','upkeep','engineering')),
    direction    TEXT NOT NULL CHECK(direction IN ('income','expense')),
    amount       REAL NOT NULL,
    sign_date    TEXT NOT NULL,
    start_date   TEXT,
    end_date     TEXT,
    summary      TEXT,
    created_at   DATETIME DEFAULT (datetime('now','localtime')),
    updated_at   DATETIME DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS contract_attachments (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    contract_id   INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    filename      TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_type     TEXT,
    file_size     INTEGER,
    created_at    DATETIME DEFAULT (datetime('now','localtime'))
  );

  CREATE INDEX IF NOT EXISTS idx_contracts_type     ON contracts(type);
  CREATE INDEX IF NOT EXISTS idx_contracts_end_date ON contracts(end_date);

  CREATE TABLE IF NOT EXISTS record_relations (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id INTEGER NOT NULL REFERENCES records(id) ON DELETE CASCADE,
    target_id INTEGER NOT NULL REFERENCES records(id) ON DELETE CASCADE,
    created_at DATETIME DEFAULT (datetime('now','localtime')),
    UNIQUE(source_id, target_id)
  );

  CREATE INDEX IF NOT EXISTS idx_records_type ON records(type);
  CREATE INDEX IF NOT EXISTS idx_records_event_date ON records(event_date);
  CREATE INDEX IF NOT EXISTS idx_attachments_record_id ON attachments(record_id);
`);

// Migrations — try/catch so re-runs on existing DBs are safe
const migrations = [
  "ALTER TABLE records ADD COLUMN member_ids TEXT",
  "ALTER TABLE records ADD COLUMN other_participants TEXT",
  "ALTER TABLE attachments ADD COLUMN category TEXT DEFAULT 'other'",
];
for (const sql of migrations) {
  try { db.exec(sql); } catch { /* column already exists */ }
}

// Seed initial admin if no users exist
const userCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c;
if (userCount === 0) {
  const initUsername = process.env.INITIAL_USERNAME || 'admin';
  const initPassword = process.env.INITIAL_PASSWORD || 'admin123';
  const hash = bcrypt.hashSync(initPassword, 10);
  db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, 'admin')").run(initUsername, hash);
  console.log(`✓ 初始管理员已创建：${initUsername} / ${initPassword}（请尽快修改密码）`);
}

export default db;
