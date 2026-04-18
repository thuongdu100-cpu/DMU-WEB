/**
 * Upsert admin in `admins` (bcrypt hash). Requires DATABASE_URL and schema: npm run db:push
 * Env: ADMIN_USERNAME (default admin), ADMIN_PASSWORD (default admin123)
 */
"use strict";

const path = require("path");
const fs = require("fs");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const root = path.join(__dirname, "..", "..");

function loadEnv() {
  const dotenv = require("dotenv");
  const rootEnv = path.join(root, ".env");
  if (fs.existsSync(rootEnv)) dotenv.config({ path: rootEnv });
  const dbEnv = path.join(root, "backend", "config", "db.env");
  if (fs.existsSync(dbEnv)) dotenv.config({ path: dbEnv });
}

loadEnv();

const prisma = new PrismaClient();

async function main() {
  const url = (process.env.DATABASE_URL || "").trim();
  if (!url) {
    throw new Error(
      "Thi\u1EBFu DATABASE_URL. \u0110\u1EB7t trong .env ho\u1EB7c backend/config/db.env"
    );
  }

  const username = (process.env.ADMIN_USERNAME || "admin").trim().toLowerCase();
  const plain = process.env.ADMIN_PASSWORD || "admin123";
  const hash = bcrypt.hashSync(String(plain), 10);

  await prisma.admins.upsert({
    where: { username },
    create: { username, password: hash, role: "admin" },
    update: { password: hash, role: "admin" }
  });

  console.log("Seed xong. T\u00EAn \u0111\u0103ng nh\u1EADp admin:", username);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
