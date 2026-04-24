/**
 * Quản lý tài khoản: chỉ admin tạo / sửa / xoá editor & contributor.
 */
"use strict";

const bcrypt = require("bcryptjs");
const { prisma } = require("../../db/prisma");
const { normalizeAdminRole } = require("../utils/adminRoles");

const USERNAME_RE = /^[a-z0-9_]{3,32}$/;

/**
 * @param {string} message
 * @param {{ status?: number, code?: string }} [opt]
 */
function svcErr(message, { status = 400, code = "BAD_REQUEST" } = {}) {
  const e = new Error(message);
  e.status = status;
  e.code = code;
  return e;
}

/**
 * @param {string | undefined} role
 * @returns {"admin"|"editor"|"contributor"|"unknown"}
 */
function normalizeRole(role) {
  const n = normalizeAdminRole(role);
  if (n === "admin" || n === "editor" || n === "contributor") return n;
  return "unknown";
}

/**
 * @param {string | undefined} actorRoleRaw
 * @returns {"admin"|"editor"|"contributor"|"unknown"}
 */
function normalizeActorRole(actorRoleRaw) {
  return normalizeRole(actorRoleRaw);
}

/**
 * @param {"admin"|"editor"|"contributor"|"unknown"} actorRole
 */
async function listUsers(actorRole) {
  if (actorRole !== "admin") {
    throw svcErr("Chỉ admin mới xem được danh sách tài khoản.", { status: 403, code: "FORBIDDEN" });
  }
  const rows = await prisma.admins.findMany({
    orderBy: { id: "asc" },
    select: { id: true, username: true, role: true, created_at: true }
  });
  return {
    ok: true,
    users: rows.map((u) => ({
      id: u.id,
      username: u.username,
      role: normalizeRole(u.role),
      createdAt: u.created_at
    }))
  };
}

/**
 * @param {"admin"|"editor"|"contributor"|"unknown"} actorRole
 * @param {{ username: string, password: string, role?: string }} body
 */
async function createUser(actorRole, body) {
  if (actorRole !== "admin") {
    throw svcErr("Chỉ admin mới được tạo tài khoản.", { status: 403, code: "FORBIDDEN" });
  }

  const username = String(body?.username || "").trim().toLowerCase();
  const password = String(body?.password || "");
  const roleRaw = String(body?.role || "contributor").trim().toLowerCase();

  if (roleRaw !== "editor" && roleRaw !== "contributor") {
    throw svcErr('role chỉ được là "editor" (người duyệt) hoặc "contributor" (người viết).', {
      code: "INVALID_ROLE"
    });
  }
  const role = roleRaw === "editor" ? "editor" : "contributor";

  if (!USERNAME_RE.test(username)) {
    throw svcErr("Tên đăng nhập: 3–32 ký tự, chữ thường, số và dấu gạch dưới.", { code: "INVALID_USERNAME" });
  }
  if (password.length < 8) {
    throw svcErr("Mật khẩu tối thiểu 8 ký tự.", { code: "WEAK_PASSWORD" });
  }

  const hash = bcrypt.hashSync(password, 10);
  try {
    const created = await prisma.admins.create({
      data: { username, password: hash, role }
    });
    return {
      ok: true,
      user: { id: created.id, username: created.username, role: normalizeRole(role), createdAt: created.created_at }
    };
  } catch (e) {
    if (e && e.code === "P2002") {
      throw svcErr("Tên đăng nhập đã tồn tại.", { code: "USERNAME_TAKEN" });
    }
    throw e;
  }
}

async function countCanonicalAdmins() {
  const rows = await prisma.admins.findMany({ select: { role: true } });
  return rows.filter((r) => normalizeAdminRole(r.role) === "admin").length;
}

/**
 * @param {"admin"|"editor"|"contributor"|"unknown"} actorRole
 * @param {number} actorId
 * @param {number} id
 * @param {{ password?: string, role?: string }} body
 */
async function updateUser(actorRole, actorId, id, body) {
  if (actorRole !== "admin") {
    throw svcErr("Chỉ admin mới được sửa tài khoản.", { status: 403, code: "FORBIDDEN" });
  }

  const targetId = Number(id);
  if (!Number.isInteger(targetId) || targetId <= 0) {
    throw svcErr("id không hợp lệ.", { code: "INVALID_ID" });
  }

  const target = await prisma.admins.findUnique({ where: { id: targetId } });
  if (!target) throw svcErr("Không tìm thấy tài khoản.", { status: 404, code: "NOT_FOUND" });

  const targetRole = normalizeRole(target.role);

  const patch = {};
  if (body?.password !== undefined) {
    const password = String(body.password || "");
    if (password.length < 8) throw svcErr("Mật khẩu tối thiểu 8 ký tự.", { code: "WEAK_PASSWORD" });
    patch.password = bcrypt.hashSync(password, 10);
  }

  if (body?.role !== undefined) {
    const next = String(body.role || "").trim().toLowerCase();
    const nr = next === "editor" ? "editor" : next === "contributor" ? "contributor" : next === "admin" ? "admin" : "";
    if (!nr) {
      throw svcErr('role chỉ nhận "admin", "editor" hoặc "contributor".', { code: "INVALID_ROLE" });
    }
    if (targetId === actorId && nr !== "admin") {
      throw svcErr("Không thể hạ quyền chính tài khoản admin đang đăng nhập.", { code: "FORBIDDEN_SELF_DEMOTE" });
    }
    if (targetRole === "admin" && nr !== "admin") {
      const admins = await countCanonicalAdmins();
      if (admins <= 1) {
        throw svcErr("Phải còn ít nhất một tài khoản admin.", { code: "FORBIDDEN_LAST_ADMIN" });
      }
    }
    patch.role = nr;
  }

  if (Object.keys(patch).length === 0) {
    throw svcErr("Không có trường nào để cập nhật.", { code: "EMPTY_PATCH" });
  }

  const updated = await prisma.admins.update({
    where: { id: targetId },
    data: patch,
    select: { id: true, username: true, role: true, created_at: true }
  });

  return {
    ok: true,
    user: {
      id: updated.id,
      username: updated.username,
      role: normalizeRole(updated.role),
      createdAt: updated.created_at
    }
  };
}

/**
 * @param {"admin"|"editor"|"contributor"|"unknown"} actorRole
 * @param {number} actorId
 * @param {number} id
 */
async function deleteUser(actorRole, actorId, id) {
  if (actorRole !== "admin") {
    throw svcErr("Chỉ admin mới được xoá tài khoản.", { status: 403, code: "FORBIDDEN" });
  }

  const targetId = Number(id);
  if (!Number.isInteger(targetId) || targetId <= 0) {
    throw svcErr("id không hợp lệ.", { code: "INVALID_ID" });
  }
  if (targetId === actorId) {
    throw svcErr("Không thể xoá chính tài khoản đang đăng nhập.", { code: "FORBIDDEN_SELF_DELETE" });
  }

  const target = await prisma.admins.findUnique({ where: { id: targetId } });
  if (!target) throw svcErr("Không tìm thấy tài khoản.", { status: 404, code: "NOT_FOUND" });

  const targetRole = normalizeRole(target.role);

  if (targetRole === "admin") {
    const admins = await countCanonicalAdmins();
    if (admins <= 1) {
      throw svcErr("Không thể xoá tài khoản admin duy nhất.", { code: "FORBIDDEN_LAST_ADMIN" });
    }
  }

  await prisma.admins.delete({ where: { id: targetId } });
  return { ok: true };
}

module.exports = {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  normalizeRole,
  normalizeActorRole
};
