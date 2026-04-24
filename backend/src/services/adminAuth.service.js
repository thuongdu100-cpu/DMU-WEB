/**
 * adminAuth.service.js
 * Xác thực admin: kiểm tra username/password so với bảng `admins` trong DB (bcrypt).
 * Tài khoản admin được tạo qua seed: `npm run db:seed`.
 */
"use strict";

const bcrypt = require("bcryptjs");
const { prisma } = require("../../db/prisma");
const { normalizeAdminRole } = require("../utils/adminRoles");

/**
 * Xác thực thông tin đăng nhập admin.
 * @param {string} usernameRaw - Username gửi lên từ client
 * @param {string} password    - Password gửi lên từ client (plaintext)
 * @returns {Promise<{ ok: boolean, adminId?: number, displayUsername?: string, role?: string }>}
 */
async function verifyAdminCredentials(usernameRaw, password) {
  const username = String(usernameRaw || "").trim().toLowerCase();
  const pass = String(password || "");

  if (!username || !pass) return { ok: false };

  const admin = await prisma.admins.findUnique({ where: { username } });
  if (!admin) return { ok: false };

  const roleRaw = String(admin.role || "").trim().toLowerCase();
  if (roleRaw === "bot") {
    return { ok: false };
  }

  const passwordMatch = await bcrypt.compare(pass, admin.password);
  if (!passwordMatch) return { ok: false };

  return {
    ok: true,
    adminId: admin.id,
    displayUsername: String(usernameRaw).trim() || username,
    role: normalizeAdminRole(admin.role)
  };
}

module.exports = { verifyAdminCredentials };
