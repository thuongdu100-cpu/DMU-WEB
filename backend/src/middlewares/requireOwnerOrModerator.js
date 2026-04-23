/**
 * Owner (admin chính) hoặc moderator (duyệt bài + quản lý tài khoản editor).
 */
"use strict";

const { normalizeAdminRole } = require("./requireOwner");

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function requireOwnerOrModerator(req, res, next) {
  if (!req.session?.admin) {
    return res.status(401).json({ ok: false, message: "Cần đăng nhập với tư cách quản trị viên." });
  }
  const r = normalizeAdminRole(req.session.adminRole);
  if (r !== "owner" && r !== "moderator") {
    return res.status(403).json({
      ok: false,
      message: "Chỉ tài khoản chủ (owner) hoặc moderator mới thực hiện được thao tác này."
    });
  }
  return next();
}

module.exports = { requireOwnerOrModerator };
