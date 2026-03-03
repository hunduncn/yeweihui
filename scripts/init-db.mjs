/**
 * 数据库初始化脚本
 *
 * 用途：在首次部署时独立初始化数据库，无需先启动应用。
 * 运行：node scripts/init-db.mjs
 *
 * 环境变量（可选）：
 *   INITIAL_USERNAME  初始管理员用户名（默认：admin）
 *   INITIAL_PASSWORD  初始管理员密码（默认：admin123）
 *   DB_PATH           数据库文件路径（默认：data/yeweihui.db）
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(ROOT, 'data', 'yeweihui.db');

const UPLOADS_DIR = path.join(ROOT, 'uploads');

// ── 目录 ──────────────────────────────────────────────────────────────
for (const dir of [path.dirname(DB_PATH), UPLOADS_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✓ 创建目录：${dir}`);
  }
}

// ── 数据库连接 ─────────────────────────────────────────────────────────
const db = new Database(DB_PATH);
db.pragma('busy_timeout = 5000');
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
console.log(`✓ 数据库：${DB_PATH}`);

// ── 建表 ──────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS records (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    title            TEXT    NOT NULL,
    type             TEXT    NOT NULL CHECK(type IN ('meeting','announcement','government','rights')),
    event_date       TEXT    NOT NULL,
    description      TEXT,
    participants     TEXT,
    member_ids       TEXT,
    other_participants TEXT,
    created_at       DATETIME DEFAULT (datetime('now','localtime')),
    updated_at       DATETIME DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS attachments (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    record_id     INTEGER NOT NULL REFERENCES records(id) ON DELETE CASCADE,
    filename      TEXT    NOT NULL,
    original_name TEXT    NOT NULL,
    file_type     TEXT,
    file_size     INTEGER,
    category      TEXT    DEFAULT 'other',
    created_at    DATETIME DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS members (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    role       TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    username   TEXT    NOT NULL UNIQUE,
    password   TEXT    NOT NULL,
    role       TEXT    NOT NULL CHECK(role IN ('admin','member')) DEFAULT 'member',
    created_at DATETIME DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS counterparties (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL UNIQUE,
    created_at DATETIME DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS contracts (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    title        TEXT    NOT NULL,
    counterparty TEXT    NOT NULL,
    type         TEXT    NOT NULL CHECK(type IN ('maintenance','management','upkeep','engineering')),
    direction    TEXT    NOT NULL CHECK(direction IN ('income','expense')),
    amount       REAL    NOT NULL,
    sign_date    TEXT    NOT NULL,
    start_date   TEXT,
    end_date     TEXT,
    summary      TEXT,
    created_at   DATETIME DEFAULT (datetime('now','localtime')),
    updated_at   DATETIME DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS contract_attachments (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    contract_id   INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    filename      TEXT    NOT NULL,
    original_name TEXT    NOT NULL,
    file_type     TEXT,
    file_size     INTEGER,
    created_at    DATETIME DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS record_relations (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id  INTEGER NOT NULL REFERENCES records(id) ON DELETE CASCADE,
    target_id  INTEGER NOT NULL REFERENCES records(id) ON DELETE CASCADE,
    created_at DATETIME DEFAULT (datetime('now','localtime')),
    UNIQUE(source_id, target_id)
  );

  CREATE INDEX IF NOT EXISTS idx_records_type          ON records(type);
  CREATE INDEX IF NOT EXISTS idx_records_event_date    ON records(event_date);
  CREATE INDEX IF NOT EXISTS idx_attachments_record_id ON attachments(record_id);
  CREATE INDEX IF NOT EXISTS idx_contracts_type        ON contracts(type);
  CREATE INDEX IF NOT EXISTS idx_contracts_end_date    ON contracts(end_date);
`);
console.log('✓ 数据表初始化完成');

// ── 初始管理员 ─────────────────────────────────────────────────────────
const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
if (userCount === 0) {
  const username = process.env.INITIAL_USERNAME || 'admin';
  const password = process.env.INITIAL_PASSWORD || 'admin123';
  const hash = bcrypt.hashSync(password, 10);
  db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, 'admin')").run(username, hash);
  console.log(`✓ 初始管理员已创建：${username} / ${password}`);
  console.log('  ⚠️  请登录后立即在「设置 → 账号管理」中修改密码');
} else {
  console.log(`  已有 ${userCount} 个用户，跳过初始管理员创建`);
}

db.close();
console.log('\n数据库初始化完成，可以启动应用了。');
