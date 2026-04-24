/**
 * Giới hạn route theo role đã chuẩn hoá (sau requireAdmin + refreshSessionAdminRole).
 */
"use strict";

const { normalizeAdminRole } = require("../utils/adminRoles");

/**
 * @param {readonly ("admin"|"editor"|"contributor")[]} allowed
 * @returns {import('express').RequestHandler}
 */
function requireSessionRoles(allowed) {
  const set = new Set(allowed);
  return (req, res, next) => {
    const role = normalizeAdminRole(req.session?.adminRole);
    if (!set.has(role)) {
      return res.status(403).json({
        ok: false,
        message: "Tài khoản của bạn không có quyền thực hiện thao tác này.",
        code: "FORBIDDEN"
      });
    }
    return next();
  };
}

module.exports = { requireSessionRoles };
