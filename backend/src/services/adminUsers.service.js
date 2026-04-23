/**
 * Quản lý tài khoản: owner toàn quyền; moderator chỉ quản editor (tài khoản đăng bài).
 */
"use strict";

const bcrypt = require("bcryptjs");
const { prisma } = require("../../db/prisma");

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
 * Chuẩn hoá role từ DB / session.
 * @param {string | undefined} role
 * @returns {"owner"|"moderator"|"editor"|"bot"|"unknown"}
 */
function normalizeRole(role) {
  const r = String(role || "").trim().toLowerCase();
  if (r === "admin" || r === "owner") return "owner";
  if (r === "moderator") return "moderator";
  if (r === "editor") return "editor";
  if (r === "bot") return "bot";
  return "unknown";
}

/**
 * @param {string | undefined} actorRoleRaw
 * @returns {"owner"|"moderator"|"editor"|"bot"|"unknown"}
 */
function normalizeActorRole(actorRoleRaw) {
  return normalizeRole(actorRoleRaw);
}

/**
 * @param {"owner"|"moderator"|"editor"|"bot"|"unknown"} actorRole
 */
async function listUsers(actorRole) {
  const where =
    actorRole === "moderator"
      ? { role: "editor" }
      : {};
  const rows = await prisma.admins.findMany({
    where,
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
 * @param {"owner"|"moderator"|"editor"|"bot"|"unknown"} actorRole
 * @param {{ username: string, password: string, role?: string }} body
 */
async function createUser(actorRole, body) {
  const username = String(body?.username || "").trim().toLowerCase();
  const password = String(body?.password || "");
  const roleRaw = String(body?.role || "editor").trim().toLowerCase();

  let role = "editor";
  if (actorRole === "moderator") {
    if (roleRaw !== "editor") {
      throw svcErr("Moderator chỉ được tạo tài khoản editor (đăng bài).", { code: "FORBIDDEN_ROLE_CREATE" });
    }
    role = "editor";
  } else if (actorRole === "owner") {
    if (roleRaw === "bot") role = "bot";
    else if (roleRaw === "moderator") role = "moderator";
    else role = "editor";
  } else {
    throw svcErr("Không có quyền tạo tài khoản.", { status: 403, code: "FORBIDDEN" });
  }

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

/**
 * @param {"owner"|"moderator"|"editor"|"bot"|"unknown"} actorRole
 * @param {number} actorId
 * @param {number} id
 * @param {{ password?: string, role?: string }} body
 */
async function updateUser(actorRole, actorId, id, body) {
  const targetId = Number(id);
  if (!Number.isInteger(targetId) || targetId <= 0) {
    throw svcErr("id không hợp lệ.", { code: "INVALID_ID" });
  }

  const target = await prisma.admins.findUnique({ where: { id: targetId } });
  if (!target) throw svcErr("Không tìm thấy tài khoản.", { status: 404, code: "NOT_FOUND" });

  const targetRole = normalizeRole(target.role);

  if (actorRole === "moderator") {
    if (targetRole !== "editor") {
      throw svcErr("Moderator chỉ được sửa tài khoản editor.", { status: 403, code: "FORBIDDEN_TARGET" });
    }
    if (body?.role !== undefined) {
      throw svcErr("Moderator không được đổi role.", { status: 403, code: "FORBIDDEN_ROLE_PATCH" });
    }
  }

  const patch = {};
  if (body?.password !== undefined) {
    const password = String(body.password || "");
    if (password.length < 8) throw svcErr("Mật khẩu tối thiểu 8 ký tự.", { code: "WEAK_PASSWORD" });
    patch.password = bcrypt.hashSync(password, 10);
  }

  if (body?.role !== undefined && actorRole === "owner") {
    const next = String(body.role || "").trim().toLowerCase();
    const nr =
      next === "bot"
        ? "bot"
        : next === "editor"
          ? "editor"
          : next === "moderator"
            ? "moderator"
            : next === "owner"
              ? "owner"
              : "";
    if (!nr) {
      throw svcErr('role chỉ nhận "owner", "moderator", "editor" hoặc "bot".', { code: "INVALID_ROLE" });
    }
    if (targetId === actorId && nr !== "owner") {
      throw svcErr("Không thể hạ quyền chính tài khoản owner đang đăng nhập.", { code: "FORBIDDEN_SELF_DEMOTE" });
    }
    if (targetRole === "owner" && nr !== "owner") {
      const owners = await prisma.admins.count({
        where: { OR: [{ role: "owner" }, { role: "admin" }] }
      });
      if (owners <= 1) {
        throw svcErr("Phải còn ít nhất một tài khoản owner.", { code: "FORBIDDEN_LAST_OWNER" });
      }
    }
    patch.role = nr === "owner" ? "owner" : nr;
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
 * @param {"owner"|"moderator"|"editor"|"bot"|"unknown"} actorRole
 * @param {number} actorId
 * @param {number} id
 */
async function deleteUser(actorRole, actorId, id) {
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

  if (actorRole === "moderator") {
    if (targetRole !== "editor") {
      throw svcErr("Moderator chỉ được xoá tài khoản editor.", { status: 403, code: "FORBIDDEN_DELETE" });
    }
  }

  if (target.username === "ai-bot") {
    throw svcErr("Không xoá được tài khoản AI mặc định (ai-bot).", { code: "FORBIDDEN_AI_BOT" });
  }

  if (targetRole === "owner") {
    const owners = await prisma.admins.count({ where: { OR: [{ role: "owner" }, { role: "admin" }] } });
    if (owners <= 1) {
      throw svcErr("Không thể xoá tài khoản owner duy nhất.", { code: "FORBIDDEN_LAST_OWNER" });
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
