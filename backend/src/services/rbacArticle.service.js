/**
 * Luồng bài viết REST + RBAC (JWT): đăng bài JSON, kiểm duyệt status, danh sách admin.
 */
"use strict";

const { z } = require("zod");
const articleModel = require("../models/article.model");

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

const createBodySchema = z.object({
  title: z.string().trim().min(1).max(500),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  contentLayout: z.any().optional(),
  categoryId: z.union([z.string(), z.number()]).optional(),
  thumbnail: z.string().optional()
});

const patchStatusSchema = z.object({
  status: z.enum(["published", "rejected"])
});

/**
 * @param {string} role
 */
function defaultStatusForRole(role) {
  const r = String(role || "").toLowerCase();
  if (r === "contributor") return "pending";
  if (r === "admin" || r === "editor") return "published";
  return "draft";
}

/**
 * @param {unknown} raw
 */
function parseCategoryId(raw) {
  if (raw == null || String(raw).trim() === "") return undefined;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) {
    throw svcErr("categoryId không hợp lệ.", { code: "INVALID_CATEGORY_ID" });
  }
  return n;
}

/**
 * @param {{ id: number, role: string }} authUser
 * @param {unknown} body
 */
async function createArticleJson(authUser, body) {
  const parsed = createBodySchema.safeParse(body || {});
  if (!parsed.success) {
    throw svcErr(parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ.", { code: "VALIDATION_ERROR" });
  }
  const { title, content, excerpt, contentLayout, categoryId, thumbnail } = parsed.data;

  let layout = [];
  if (contentLayout != null && !Array.isArray(contentLayout)) {
    throw svcErr("contentLayout phải là mảng.", { code: "INVALID_CONTENT_LAYOUT" });
  }
  if (Array.isArray(contentLayout) && contentLayout.length > 0) {
    layout = contentLayout;
  } else if (String(content || "").trim()) {
    layout = [{ type: "text", text: String(content) }];
  }

  if (!layout.length) {
    throw svcErr("Cần có content hoặc contentLayout.", { code: "EMPTY_CONTENT" });
  }

  const status = defaultStatusForRole(authUser.role);

  const created = await articleModel.createArticle({
    title,
    content: String(content || ""),
    excerpt: excerpt != null ? String(excerpt) : "",
    media: [],
    contentLayout: JSON.stringify(layout),
    status,
    authorId: authUser.id,
    categoryId: parseCategoryId(categoryId),
    thumbnail: thumbnail != null ? String(thumbnail).trim() : undefined
  });

  return { ok: true, article: created };
}

/**
 * @param {{ id: number, role: string }} authUser
 */
async function listArticlesForAdmin(authUser) {
  const authorIdEq = String(authUser.role).toLowerCase() === "contributor" ? authUser.id : undefined;
  const articles = await articleModel.listArticlesAdmin(
    authorIdEq != null ? { authorIdEq } : {}
  );
  return { ok: true, articles };
}

/**
 * @param {string|number} rawId
 * @param {{ id: number, role: string }} authUser
 * @param {unknown} body
 */
async function patchArticleStatus(rawId, authUser, body) {
  void authUser;
  const id = Number.parseInt(String(rawId), 10);
  if (!Number.isInteger(id) || id <= 0) {
    throw svcErr("id không hợp lệ.", { code: "INVALID_ID" });
  }

  const parsed = patchStatusSchema.safeParse(body || {});
  if (!parsed.success) {
    throw svcErr('Trường status chỉ nhận "published" hoặc "rejected".', { code: "VALIDATION_ERROR" });
  }
  const nextStatus = parsed.data.status;

  const prev = await articleModel.getArticleById(id);
  if (!prev) {
    throw svcErr("Không tìm thấy bài viết.", { status: 404, code: "NOT_FOUND" });
  }

  const updated = await articleModel.updateArticle(id, { status: nextStatus });
  if (!updated) {
    throw svcErr("Không tìm thấy bài viết.", { status: 404, code: "NOT_FOUND" });
  }
  return { ok: true, article: updated };
}

/**
 * Danh sách published (trang chủ / API công khai).
 */
async function listPublishedSummaries() {
  const posts = await articleModel.listPublicSummaries();
  return { ok: true, posts, articles: posts };
}

module.exports = {
  createArticleJson,
  listArticlesForAdmin,
  patchArticleStatus,
  listPublishedSummaries
};
