/**
 * PostgreSQL via Prisma. Schema: database/prisma/schema.prisma
 */
const config = require("../../config");
const { prisma } = require("../../db/prisma");

function getSchemaFromDatabaseUrl(url) {
  const raw = String(url || "").trim();
  if (!raw) return "public";
  try {
    const parsed = new URL(raw);
    return parsed.searchParams.get("schema") || "public";
  } catch {
    return "public";
  }
}

async function connectDatabase() {
  const url = config.database?.url;
  if (!url || String(url).trim() === "") {
    throw new Error(
      "Thi\u1EBFu DATABASE_URL. \u0110\u1EB7t trong .env ho\u1EB7c backend/config/db.env (postgresql://...)"
    );
  }
  await prisma.$connect();
  return prisma;
}

function getSchema() {
  return getSchemaFromDatabaseUrl(config.database?.url);
}

function getTable() {
  return "articles";
}

module.exports = {
  connectDatabase,
  prisma,
  getPrisma: () => prisma,
  getSchema,
  getTable
};
