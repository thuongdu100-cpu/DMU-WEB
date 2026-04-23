/**
 * Cho phép đăng bài qua phiên admin (cookie) hoặc Bearer token (AI / automation).
 * Bearer: Authorization: Bearer <AI_PUBLISH_BEARER_TOKEN> — gắn với user `ai-bot` (hoặc AI_PUBLISH_ADMIN_ID).
 */
"use strict";

const crypto = require("crypto");
const config = require("../../config");
const { prisma } = require("../../db/prisma");

/**
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function timingSafeEqualStr(a, b) {
  const aa = Buffer.from(String(a || ""), "utf8");
  const bb = Buffer.from(String(b || ""), "utf8");
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

/**
 * @returns {Promise<number | null>}
 */
async function resolveBotAdminId() {
  if (config.aiPublishAdminId) return config.aiPublishAdminId;
  const bot = await prisma.admins.findUnique({ where: { username: "ai-bot" } });
  return bot?.id ?? null;
}

/**
 * @param {import('express').Request} req
 * @returns {Promise<boolean>}
 */
async function attachBearerAdmin(req) {
  const token = String(config.aiPublishBearerToken || "").trim();
  if (token.length < 16) return false;

  const h = String(req.headers?.authorization || "");
  if (!h.toLowerCase().startsWith("bearer ")) return false;
  const got = h.slice(7).trim();
  if (!timingSafeEqualStr(got, token)) return false;

  const botId = await resolveBotAdminId();
  if (!botId) return false;

  const row = await prisma.admins.findUnique({ where: { id: botId } });
  if (!row || String(row.role || "").toLowerCase() !== "bot") return false;

  req.authAdminId = botId;
  req.authAdminRole = "bot";
  req.authFromBearer = true;
  return true;
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function requireAdminOrBearer(req, res, next) {
  if (req.session?.admin) return next();
  void (async () => {
    try {
      if (await attachBearerAdmin(req)) return next();
    } catch {
      /* ignore */
    }
    return res.status(401).json({
      ok: false,
      message: "Cần đăng nhập quản trị hoặc Bearer token hợp lệ (AI)."
    });
  })();
}

module.exports = { requireAdminOrBearer, attachBearerAdmin };
