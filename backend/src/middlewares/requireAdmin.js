/**
 * requireAdmin.js
 * Middleware xác thực phiên đăng nhập admin.
 * Dùng cho tất cả route chỉ admin mới được truy cập.
 *
 * Hoạt động: kiểm tra req.session.admin === true (được set khi đăng nhập thành công).
 * Nếu chưa đăng nhập → trả 401 Unauthorized.
 */
"use strict";

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function requireAdmin(req, res, next) {
  if (req.session?.admin) return next();
  return res.status(401).json({
    ok: false,
    message: "Cần đăng nhập với tư cách quản trị viên."
  });
}

module.exports = { requireAdmin };
