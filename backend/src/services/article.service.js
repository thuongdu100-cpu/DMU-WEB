"use strict";

const fs = require("fs");
const { z } = require("zod");
const articleModel = require("../models/article.model");
const { translateErrorString } = require("../utils/vietnameseErrors");

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

const imageMime = /^image\//i;
const videoMime = /^video\//i;

function createServiceError(message, { status = 400, code = "BAD_REQUEST", cause } = {}) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  if (cause) err.cause = cause;
  return err;
}

function sanitizeText(value) {
  return String(value ?? "").replace(/\0/g, "").trim();
}

function parseJsonField(raw, fieldName) {
  const text = String(raw ?? "").trim();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    throw createServiceError(`Trường ${fieldName} không phải JSON hợp lệ.`, {
      status: 400,
      code: "INVALID_JSON"
    });
  }
}

function normalizePagination(query) {
  const pageRaw = Number.parseInt(String(query?.page ?? DEFAULT_PAGE), 10);
  const limitRaw = Number.parseInt(String(query?.limit ?? DEFAULT_LIMIT), 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : DEFAULT_PAGE;
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, MAX_LIMIT) : DEFAULT_LIMIT;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function toMediaObject(mediaArray) {
  const images = [];
  const videos = [];
  for (const item of Array.isArray(mediaArray) ? mediaArray : []) {
    if (!item || typeof item !== "object") continue;
    if (item.type === "video" && typeof item.url === "string" && item.url.startsWith("/uploads/")) {
      videos.push(item.url);
      continue;
    }
    if (typeof item.url === "string" && item.url.startsWith("/uploads/")) {
      images.push(item.url);
    }
  }
  return { images, videos };
}

function normalizeArticle(article) {
  const safe = article || {};
  const mediaObject = toMediaObject(safe.media);
  const legacyMedia = [];
  for (const url of mediaObject.images) legacyMedia.push({ type: "image", url });
  for (const url of mediaObject.videos) legacyMedia.push({ type: "video", url });
  return {
    ...safe,
    images: mediaObject.images,
    videos: mediaObject.videos,
    media: mediaObject,
    mediaItems: legacyMedia
  };
}

function cleanupUploadedFiles(files) {
  for (const file of Array.isArray(files) ? files : []) {
    const absPath = String(file?.path || "");
    if (!absPath) continue;
    try {
      if (fs.existsSync(absPath)) fs.unlinkSync(absPath);
    } catch {
      // Ignore cleanup errors to avoid masking the original error.
    }
  }
}

function fileToMediaItem(file) {
  const mime = String(file?.mimetype || "");
  const filename = String(file?.filename || "");
  if (!filename) {
    throw createServiceError("Thiếu tệp tải lên hợp lệ.", { code: "FILE_REQUIRED" });
  }
  if (!imageMime.test(mime) && !videoMime.test(mime)) {
    throw createServiceError("Loại tệp không hỗ trợ. Chỉ cho phép ảnh hoặc video.", {
      code: "INVALID_FILE_TYPE"
    });
  }
  if (videoMime.test(mime)) return { type: "video", url: `/uploads/videos/${filename}` };
  return { type: "image", url: `/uploads/images/${filename}` };
}

function buildFilePool(files) {
  const pool = new Map();
  for (const file of Array.isArray(files) ? files : []) {
    const fieldname = String(file?.fieldname || "").trim() || "media";
    if (!pool.has(fieldname)) pool.set(fieldname, []);
    pool.get(fieldname).push(file);
  }
  return pool;
}

function consumeFile(pool, preferredField) {
  const candidates = [];
  const cleanField = sanitizeText(preferredField);
  if (cleanField) candidates.push(cleanField);
  candidates.push("media", "media[]");
  for (const key of candidates) {
    const list = pool.get(key);
    if (list && list.length) return list.shift();
  }
  return null;
}

function ensureNoUnusedFiles(pool) {
  for (const entry of pool.values()) {
    if (entry.length > 0) {
      throw createServiceError("Số file tải lên không khớp với contentLayout/mediaPlan.", {
        code: "UNUSED_UPLOADS"
      });
    }
  }
}

function parseStatus(raw, { required = false } = {}) {
  if (raw == null || String(raw).trim() === "") {
    if (required) return "published";
    return undefined;
  }
  const status = sanitizeText(raw).toLowerCase();
  if (status === "draft" || status === "published") return status;
  throw createServiceError('status chỉ chấp nhận "draft" hoặc "published".', {
    code: "INVALID_STATUS"
  });
}

const createSchema = z
  .object({
    title: z.string().trim().min(1, "Tiêu đề là bắt buộc.").max(500, "Tiêu đề quá dài."),
    content: z.string().optional(),
    contentLayout: z.any().optional(),
    excerpt: z.string().optional(),
    categoryId: z.union([z.string(), z.number()]).optional(),
    thumbnail: z.string().optional()
  })
  .superRefine((data, ctx) => {
    const hasContent = sanitizeText(data.content).length > 0;
    const hasLayout = Array.isArray(data.contentLayout) && data.contentLayout.length > 0;
    if (!hasContent && !hasLayout) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cần có nội dung hoặc contentLayout."
      });
    }
  });

const updateSchema = z.object({
  title: z.string().trim().min(1, "Tiêu đề không được để trống.").max(500, "Tiêu đề quá dài.").optional(),
  content: z.string().optional(),
  contentLayout: z.any().optional(),
  excerpt: z.string().optional(),
  categoryId: z.union([z.string(), z.number()]).optional(),
  thumbnail: z.string().optional(),
  mediaPlan: z.any().optional()
});

function parseCategoryId(raw) {
  if (raw == null || String(raw).trim() === "") return undefined;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) {
    throw createServiceError("categoryId không hợp lệ.", { code: "INVALID_CATEGORY_ID" });
  }
  return n;
}

function assertAdminSession(session) {
  const adminId = Number(session?.adminId);
  if (!Number.isInteger(adminId) || adminId <= 0) {
    throw createServiceError("Phiên đăng nhập quản trị không hợp lệ.", {
      status: 401,
      code: "INVALID_ADMIN_SESSION"
    });
  }
  return adminId;
}

function safeError(err, fallback) {
  const translated = translateErrorString(String(err?.message || "").trim());
  const message = translated || fallback;
  return createServiceError(message, {
    status: err?.status || 400,
    code: err?.code || "ARTICLE_ERROR",
    cause: err
  });
}

function buildMediaFromPlan(mediaPlan, pool) {
  if (!Array.isArray(mediaPlan)) {
    throw createServiceError("mediaPlan phải là mảng.", { code: "INVALID_MEDIA_PLAN" });
  }
  const media = [];
  for (const slot of mediaPlan) {
    if (!slot || typeof slot !== "object") continue;
    if (typeof slot.url === "string" && slot.url.startsWith("/uploads/")) {
      media.push({ type: slot.type === "video" ? "video" : "image", url: slot.url });
      continue;
    }
    if (slot.new === true || slot.isNew === true) {
      const file = consumeFile(pool, slot.fieldname || slot.fileField || slot.uploadField);
      if (!file) {
        throw createServiceError("Thiếu file cho một ô mediaPlan mới.", { code: "MISSING_MEDIA_FILE" });
      }
      const item = fileToMediaItem(file);
      if (slot.type === "video" && item.type !== "video") {
        throw createServiceError("Ô mediaPlan yêu cầu video nhưng file tải lên không phải video.", {
          code: "MEDIA_TYPE_MISMATCH"
        });
      }
      if (slot.type === "image" && item.type !== "image") {
        throw createServiceError("Ô mediaPlan yêu cầu ảnh nhưng file tải lên không phải ảnh.", {
          code: "MEDIA_TYPE_MISMATCH"
        });
      }
      media.push(item);
    }
  }
  return media;
}

function buildFromContentLayout(layout, pool) {
  if (!Array.isArray(layout)) {
    throw createServiceError("contentLayout phải là mảng.", { code: "INVALID_CONTENT_LAYOUT" });
  }
  const resolvedLayout = [];
  const media = [];
  const textParts = [];

  for (const block of layout) {
    if (!block || typeof block !== "object") continue;
    if (block.type === "text") {
      const text = String(block.text ?? "");
      resolvedLayout.push({ type: "text", text });
      if (sanitizeText(text)) textParts.push(text);
      continue;
    }
    if (block.type !== "image" && block.type !== "video") continue;

    if (typeof block.url === "string" && block.url.startsWith("/uploads/")) {
      const type = block.type === "video" ? "video" : "image";
      resolvedLayout.push({ type, url: block.url, alt: String(block.alt || "") });
      media.push({ type, url: block.url });
      continue;
    }

    if (block.new === true || block.isNew === true) {
      const file = consumeFile(pool, block.fieldname || block.fileField || block.uploadField);
      if (!file) {
        throw createServiceError("Thiếu file cho một khối media mới trong contentLayout.", {
          code: "MISSING_LAYOUT_FILE"
        });
      }
      const item = fileToMediaItem(file);
      if (block.type !== item.type) {
        throw createServiceError("Loại file không khớp với kiểu khối trong contentLayout.", {
          code: "MEDIA_TYPE_MISMATCH"
        });
      }
      resolvedLayout.push({ type: item.type, url: item.url, alt: String(block.alt || "") });
      media.push(item);
      continue;
    }

    throw createServiceError("Khối media trong contentLayout cần url hoặc new=true.", {
      code: "INVALID_CONTENT_LAYOUT"
    });
  }

  return {
    content: textParts.join("\n\n"),
    contentLayout: resolvedLayout,
    media
  };
}

async function listAdmin(query) {
  const { page, limit, skip } = normalizePagination(query);
  const all = await articleModel.listArticlesAdmin();
  const normalized = all.map(normalizeArticle);
  const articles = normalized.slice(skip, skip + limit);
  return {
    ok: true,
    articles,
    pagination: { page, limit, total: normalized.length, totalPages: Math.max(1, Math.ceil(normalized.length / limit)) }
  };
}

async function getAdmin(id) {
  const article = await articleModel.getArticleById(id);
  if (!article) {
    throw createServiceError("Không tìm thấy bài viết.", { status: 404, code: "ARTICLE_NOT_FOUND" });
  }
  return { ok: true, article: normalizeArticle(article) };
}

async function createFromMultipart(req) {
  const uploadedFiles = req.files || [];
  try {
    const adminId = assertAdminSession(req.session);
    const contentLayout = parseJsonField(req.body?.contentLayout, "contentLayout");
    const parsed = createSchema.safeParse({
      title: req.body?.title,
      content: req.body?.content,
      contentLayout,
      excerpt: req.body?.excerpt,
      categoryId: req.body?.categoryId,
      thumbnail: req.body?.thumbnail
    });
    if (!parsed.success) {
      throw createServiceError(parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ.", {
        code: "VALIDATION_ERROR"
      });
    }

    const pool = buildFilePool(uploadedFiles);
    let content = sanitizeText(req.body?.content);
    let mediaList = [];
    let contentLayoutPayload;

    if (Array.isArray(contentLayout) && contentLayout.length) {
      const built = buildFromContentLayout(contentLayout, pool);
      content = built.content || content;
      mediaList = built.media;
      contentLayoutPayload = JSON.stringify(built.contentLayout);
    } else {
      mediaList = [];
      for (const file of uploadedFiles) {
        mediaList.push(fileToMediaItem(file));
      }
      // Since all files were consumed from direct mapping, clear pool.
      for (const key of pool.keys()) pool.set(key, []);
    }

    ensureNoUnusedFiles(pool);

    const created = await articleModel.createArticle({
      title: sanitizeText(req.body?.title),
      content,
      excerpt: sanitizeText(req.body?.excerpt),
      media: mediaList,
      contentLayout: contentLayoutPayload,
      status: parseStatus(req.body?.status, { required: true }),
      authorId: adminId,
      categoryId: parseCategoryId(req.body?.categoryId),
      thumbnail: sanitizeText(req.body?.thumbnail) || undefined
    });

    return { ok: true, article: normalizeArticle(created), status: 201 };
  } catch (err) {
    cleanupUploadedFiles(uploadedFiles);
    throw safeError(err, "Không tạo được bài viết.");
  }
}

async function updateFromMultipart(req) {
  const uploadedFiles = req.files || [];
  try {
    assertAdminSession(req.session);
    const prev = await articleModel.getArticleById(req.params.id);
    if (!prev) {
      throw createServiceError("Không tìm thấy bài viết.", { status: 404, code: "ARTICLE_NOT_FOUND" });
    }

    const contentLayout = parseJsonField(req.body?.contentLayout, "contentLayout");
    const mediaPlan = parseJsonField(req.body?.mediaPlan, "mediaPlan");
    const parsed = updateSchema.safeParse({
      title: req.body?.title,
      content: req.body?.content,
      contentLayout,
      excerpt: req.body?.excerpt,
      categoryId: req.body?.categoryId,
      thumbnail: req.body?.thumbnail,
      mediaPlan
    });
    if (!parsed.success) {
      throw createServiceError(parsed.error.issues[0]?.message || "Dữ liệu cập nhật không hợp lệ.", {
        code: "VALIDATION_ERROR"
      });
    }

    const pool = buildFilePool(uploadedFiles);
    const patch = {};

    if (req.body?.title !== undefined) patch.title = sanitizeText(req.body.title);
    if (req.body?.content !== undefined) patch.content = String(req.body.content ?? "");
    if (req.body?.excerpt !== undefined) patch.excerpt = sanitizeText(req.body.excerpt);
    if (req.body?.status !== undefined) patch.status = parseStatus(req.body.status);
    if (req.body?.thumbnail !== undefined) patch.thumbnail = sanitizeText(req.body.thumbnail) || null;
    if (req.body?.categoryId !== undefined) patch.categoryId = parseCategoryId(req.body.categoryId) ?? null;

    if (Array.isArray(contentLayout) && contentLayout.length) {
      const built = buildFromContentLayout(contentLayout, pool);
      patch.content = built.content || patch.content || prev.content;
      patch.media = built.media;
      patch.contentLayout = JSON.stringify(built.contentLayout);
    } else if (Array.isArray(mediaPlan)) {
      patch.media = buildMediaFromPlan(mediaPlan, pool);
    } else if (uploadedFiles.length > 0) {
      patch.media = uploadedFiles.map(fileToMediaItem);
      for (const key of pool.keys()) pool.set(key, []);
    }

    ensureNoUnusedFiles(pool);

    const updated = await articleModel.updateArticle(req.params.id, patch);
    if (!updated) {
      throw createServiceError("Không tìm thấy bài viết.", { status: 404, code: "ARTICLE_NOT_FOUND" });
    }
    return { ok: true, article: normalizeArticle(updated) };
  } catch (err) {
    cleanupUploadedFiles(uploadedFiles);
    throw safeError(err, "Không cập nhật được bài viết.");
  }
}

async function remove(id) {
  const deleted = await articleModel.deleteArticle(id);
  if (!deleted) {
    throw createServiceError("Không tìm thấy bài viết.", { status: 404, code: "ARTICLE_NOT_FOUND" });
  }
  return { ok: true };
}

async function listPublic(query) {
  const { page, limit, skip } = normalizePagination(query);
  const all = await articleModel.listPublicSummaries();
  const posts = all.slice(skip, skip + limit);
  return {
    ok: true,
    posts,
    articles: posts,
    pagination: { page, limit, total: all.length, totalPages: Math.max(1, Math.ceil(all.length / limit)) }
  };
}

async function getPublic(id) {
  const article = await articleModel.getPublishedArticle(id);
  if (!article) {
    throw createServiceError("Không tìm thấy bài viết.", { status: 404, code: "ARTICLE_NOT_FOUND" });
  }
  const normalized = normalizeArticle(article);
  return { ok: true, article: normalized, post: normalized };
}

module.exports = {
  listAdmin,
  getAdmin,
  createFromMultipart,
  updateFromMultipart,
  remove,
  listPublic,
  getPublic
};
