const { prisma, getSchema } = require("../models/database");

async function health(req, res, next) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      ok: true,
      service: "dmu-web-api",
      orm: "prisma",
      schema: getSchema(),
      uploadParser: "busboy"
    });
  } catch (e) {
    next(e);
  }
}

module.exports = { health };
