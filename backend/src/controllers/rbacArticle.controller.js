/**
 * Controller REST RBAC (JWT) — bài viết + tạo user (admin).
 */
"use strict";

const rbacArticleService = require("../services/rbacArticle.service");
const adminUsersService = require("../services/adminUsers.service");

/**
 * @param {import('express').Response} res
 * @param {unknown} err
 */
function sendErr(res, err) {
  return res.status(err?.status || 400).json({
    ok: false,
    message: String(err?.message || "Lỗi."),
    code: String(err?.code || "RBAC_ERROR")
  });
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function listPublished(req, res, next) {
  try {
    const data = await rbacArticleService.listPublishedSummaries();
    res.json(data);
  } catch (e) {
    next(e);
  }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function listAdmin(req, res, next) {
  try {
    const u = req.authUser;
    if (!u) return res.status(401).json({ ok: false, message: "Chưa xác thực.", code: "UNAUTHENTICATED" });
    const data = await rbacArticleService.listArticlesForAdmin(u);
    res.json(data);
  } catch (e) {
    if (e?.code) return sendErr(res, e);
    next(e);
  }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function createArticle(req, res, next) {
  try {
    const u = req.authUser;
    if (!u) return res.status(401).json({ ok: false, message: "Chưa xác thực.", code: "UNAUTHENTICATED" });
    const data = await rbacArticleService.createArticleJson(u, req.body);
    res.status(201).json(data);
  } catch (e) {
    if (e?.code) return sendErr(res, e);
    next(e);
  }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function patchStatus(req, res, next) {
  try {
    const u = req.authUser;
    if (!u) return res.status(401).json({ ok: false, message: "Chưa xác thực.", code: "UNAUTHENTICATED" });
    const data = await rbacArticleService.patchArticleStatus(req.params.id, u, req.body);
    res.json(data);
  } catch (e) {
    if (e?.code) return sendErr(res, e);
    next(e);
  }
}

/**
 * Admin tạo editor hoặc contributor (bcrypt trong adminUsers.service).
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function createStaffUser(req, res, next) {
  try {
    const role = String(req.body?.role || "").trim().toLowerCase();
    if (role !== "editor" && role !== "contributor") {
      return res.status(400).json({
        ok: false,
        message: 'Trường role chỉ chấp nhận "editor" (duyệt bài) hoặc "contributor" (viết bài).',
        code: "INVALID_ROLE"
      });
    }
    const data = await adminUsersService.createUser("admin", { ...(req.body || {}), role });
    res.status(201).json(data);
  } catch (e) {
    if (e?.code) return sendErr(res, e);
    next(e);
  }
}

module.exports = {
  listPublished,
  listAdmin,
  createArticle,
  patchStatus,
  createStaffUser
};
