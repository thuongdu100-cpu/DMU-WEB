/**
 * GET /api/db-ping — kiem tra ket noi PostgreSQL (SELECT 1).
 */
const express = require("express");
const { prisma } = require("../../../db/prisma");

const router = express.Router();

router.get("/db-ping", async (req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1 AS ok`;
    res.json({ ok: true, db: true, message: "PostgreSQL OK" });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
