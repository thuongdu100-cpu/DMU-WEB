/**
 * Chay Prisma sau khi nap .env (goc) va backend/config/db.env.
 * Luon chay tu thu muc goc du an (cwd = root).
 */
"use strict";

const { spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const root = path.join(__dirname, "..");
const dotenv = require("dotenv");

const rootEnv = path.join(root, ".env");
if (fs.existsSync(rootEnv)) {
  dotenv.config({ path: rootEnv });
}
const dbEnv = path.join(root, "backend", "config", "db.env");
if (fs.existsSync(dbEnv)) {
  dotenv.config({ path: dbEnv, override: true });
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node scripts/prisma-env.cjs <prisma-args...>");
  process.exit(1);
}

const r = spawnSync("npx", ["prisma", ...args], {
  stdio: "inherit",
  cwd: root,
  env: process.env,
  shell: process.platform === "win32"
});

if (r.error) {
  console.error(r.error);
  process.exit(1);
}
process.exit(r.status === null ? 1 : r.status);
