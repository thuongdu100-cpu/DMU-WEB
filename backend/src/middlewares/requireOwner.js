/**
 * Chỉ tài khoản role owner (hoặc legacy admin) mới được quản lý tài khoản con.
 */
"use strict";

/**
 * @param {string | undefined} role
 * @returns {"owner"|"moderator"|"editor"|"bot"|"unknown"}
 */
function normalizeAdminRole(role) {
  const r = String(role || "").trim().toLowerCase();
  if (r === "admin" || r === "owner") return "owner";
  if (r === "moderator") return "moderator";
  if (r === "editor") return "editor";
  if (r === "bot") return "bot";
  return "unknown";
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function requireOwner(req, res, next) {
  if (!req.session?.admin) {
    return res.status(401).json({ ok: false, message: "Cần đăng nhập với tư cách quản trị viên." });
  }
  if (normalizeAdminRole(req.session.adminRole) !== "owner") {
    return res.status(403).json({ ok: false, message: "Chỉ tài khoản chủ (owner) mới thực hiện được thao tác này." });
  }
  return next();
}

module.exports = { requireOwner, normalizeAdminRole };
