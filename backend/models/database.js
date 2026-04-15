/**
 * Kết nối SQLite qua node:sqlite (có sẵn từ Node.js 22.5+, không cần native addon).
 */
const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");
const config = require("../config");

const CREATE_POSTS_SQL = `
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  excerpt TEXT DEFAULT '',
  images TEXT NOT NULL DEFAULT '[]',
  videos TEXT NOT NULL DEFAULT '[]',
  requiresLogin INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
`;

function ensureDirForFile(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

let _db;

function migratePostsTable(db) {
  try {
    db.exec(`ALTER TABLE posts ADD COLUMN media TEXT NOT NULL DEFAULT '[]'`);
  } catch (e) {
    const msg = String(e && e.message);
    if (!msg.includes("duplicate column") && !msg.includes("already exists")) throw e;
  }
  try {
    db.exec(`ALTER TABLE posts ADD COLUMN content_layout TEXT NOT NULL DEFAULT ''`);
  } catch (e) {
    const msg = String(e && e.message);
    if (!msg.includes("duplicate column") && !msg.includes("already exists")) throw e;
  }
  try {
    db.exec(`ALTER TABLE posts ADD COLUMN status TEXT NOT NULL DEFAULT 'published'`);
  } catch (e) {
    const msg = String(e && e.message);
    if (!msg.includes("duplicate column") && !msg.includes("already exists")) throw e;
  }
}

function openDatabase() {
  ensureDirForFile(config.paths.database);
  const db = new DatabaseSync(config.paths.database);
  db.exec(CREATE_POSTS_SQL);
  migratePostsTable(db);
  return db;
}

function getDb() {
  if (!_db) _db = openDatabase();
  return _db;
}

module.exports = { getDb, openDatabase, CREATE_POSTS_SQL };
