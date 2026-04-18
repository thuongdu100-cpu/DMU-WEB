/**
 * Chay lan luot cac file .sql trong database/scripts/ bang Prisma.
 * Dung $executeRawUnsafe — chi chay SQL tin cay (tu ban hoac team).
 *
 * Moi file .sql: mot cau lenh SQL day du (co the nhieu dong, ket thuc bang ;).
 *
 * Usage (tu thu muc goc repo):
 *   npm run db:run-sql-scripts
 */
"use strict";

const path = require("path");
const fs = require("fs");
const { prisma } = require("./prisma");

const root = path.join(__dirname, "..", "..");

function loadEnv() {
  const dotenv = require("dotenv");
  const rootEnv = path.join(root, ".env");
  if (fs.existsSync(rootEnv)) dotenv.config({ path: rootEnv });
  const dbEnv = path.join(root, "backend", "config", "db.env");
  if (fs.existsSync(dbEnv)) dotenv.config({ path: dbEnv, override: true });
}

loadEnv();

const scriptsDir = path.join(root, "database", "scripts");

async function main() {
  if (!fs.existsSync(scriptsDir)) {
    console.log("Khong co thu muc database/scripts — bo qua.");
    return;
  }

  const files = fs
    .readdirSync(scriptsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (!files.length) {
    console.log("Khong co file .sql trong database/scripts — bo qua.");
    return;
  }

  await prisma.$connect();

  for (const file of files) {
    const full = path.join(scriptsDir, file);
    let body = fs.readFileSync(full, "utf8").trim();
    if (!body) continue;

    body = body.replace(/;\s*$/, "");
    console.log("Chay:", file);
    await prisma.$executeRawUnsafe(body);
  }

  console.log("Xong db:run-sql-scripts.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
