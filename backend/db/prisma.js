"use strict";

const { PrismaClient } = require("@prisma/client");

const globalForPrisma = globalThis;

/** @type {PrismaClient} */
const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Ngat ket noi (test / graceful shutdown).
 * @returns {Promise<void>}
 */
async function disconnectPrisma() {
  await prisma.$disconnect();
}

module.exports = { prisma, PrismaClient, disconnectPrisma };
