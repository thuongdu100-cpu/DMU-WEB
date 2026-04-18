/**
 * article.controller.js
 * Xử lý HTTP request/response cho tài nguyên bài viết (articles).
 * Tầng trung gian giữa Routes và Model.
 */
"use strict";

const articleModel = require("../models/article.model");
const { mapMediaFiles } = require("../middlewares/uploadPostFiles");
const { mergeContentLayoutWithFiles } = require("../utils/contentLayoutMerge");
const { translateErrorString } = require("../utils/vietnameseErrors");

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Lấy status từ request body, chỉ chấp nhận "draft" hoặc "published".
 * Trả undefined nếu không hợp lệ (giữ status cũ khi update).
 */
function parseStatus(req) {
  const s = req.body?.status;
  if (s === "draft" || s === "published") return s;
  return undefined;
}

/**
 * Dịch thông báo lỗi sang tiếng Việt (hiển thị cho client).
 * @param {Error} err
 * @param {string} fallback
 */
function clientMessage(err, fallback) {
  const translated = translateErrorString(err?.message ? String(err.message) : "");
  return translated || fallback;
}

/**
 * Chuẩn hoá response bài viết — thêm images/videos/media array riêng.
 */
function normalizeArticleResponse(article) {
  const safe = article || {};
  return {
    article: safe,
    post: safe, // backward compat
    images: Array.isArray(safe.images) ? safe.images : [],
    videos: Array.isArray(safe.videos) ? safe.videos : [],
    media: Array.isArray(safe.media) ? safe.media : []
  };
}

// ─── Admin handlers ───────────────────────────────────────────────────────────

/**
 * GET /api/admin/articles
 * Danh sách tất cả bài viết (kể cả draft).
 */
async function listAdmin(req, res, next) {
  try {
    const articles = await articleModel.listArticlesAdmin();
    res.json({ ok: true, articles });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/articles/:id
 * Chi tiết bài viết theo id (admin xem cả draft).
 */
async function getAdmin(req, res, next) {
  try {
    const article = await articleModel.getArticleById(req.params.id);
    if (!article) return res.status(404).json({ ok: false, message: "Không tìm thấy bài viết." });
    res.json({ ok: true, article });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/articles  (multipart/form-data)
 * Tạo bài viết mới với file upload.
 */
async function createFromMultipart(req, res, next) {
  try {
    const rawLayout = req.body.contentLayout;

    if (rawLayout != null && String(rawLayout).trim() !== "") {
      let layout;
      try {
        layout = JSON.parse(rawLayout);
      } catch {
        return res.status(400).json({ ok: false, message: "Trường contentLayout không phải JSON hợp lệ." });
      }
      const { layout: resolved, media, plainText } = mergeContentLayoutWithFiles(layout, req.files);
      const article = await articleModel.createArticle({
        title: req.body.title,
        content: plainText,
        excerpt: req.body.excerpt,
        media,
        contentLayout: JSON.stringify(resolved),
        status: parseStatus(req),
        authorId: req.session?.adminId,
        categoryId: req.body.categoryId,
        thumbnail: req.body.thumbnail
      });
      return res.status(201).json({ ok: true, ...normalizeArticleResponse(article) });
    }

    // Không có contentLayout → dùng file upload trực tiếp
    const media = mapMediaFiles(req);
    const article = await articleModel.createArticle({
      title: req.body.title,
      content: req.body.content || "",
      excerpt: req.body.excerpt,
      media,
      status: parseStatus(req),
      authorId: req.session?.adminId,
      categoryId: req.body.categoryId,
      thumbnail: req.body.thumbnail
    });
    return res.status(201).json({ ok: true, ...normalizeArticleResponse(article) });
  } catch (err) {
    res.status(400).json({ ok: false, message: clientMessage(err, "Không tạo được bài viết.") });
  }
}

/**
 * PUT /api/admin/articles/:id  (multipart/form-data)
 * Cập nhật bài viết.
 */
async function updateFromMultipart(req, res, next) {
  try {
    const prev = await articleModel.getArticleById(req.params.id);
    if (!prev) return res.status(404).json({ ok: false, message: "Không tìm thấy bài viết." });

    const rawLayout = req.body.contentLayout;
    if (rawLayout != null && String(rawLayout).trim() !== "") {
      let layout;
      try {
        layout = JSON.parse(rawLayout);
      } catch {
        return res.status(400).json({ ok: false, message: "Trường contentLayout không phải JSON hợp lệ." });
      }
      const { layout: resolved, media, plainText } = mergeContentLayoutWithFiles(layout, req.files);
      const patch = {
        title: req.body.title ?? prev.title,
        content: plainText,
        excerpt: req.body.excerpt ?? prev.excerpt,
        media,
        contentLayout: JSON.stringify(resolved),
        status: parseStatus(req),
        categoryId: req.body.categoryId,
        thumbnail: req.body.thumbnail
      };
      const updated = await articleModel.updateArticle(req.params.id, patch);
      return res.json({ ok: true, ...normalizeArticleResponse(updated) });
    }

    // Không có contentLayout → dùng mediaPlan
    const rawPlan = req.body.mediaPlan;
    if (rawPlan == null || rawPlan === "") {
      return res.status(400).json({ ok: false, message: "Thiếu mediaPlan hoặc contentLayout." });
    }
    let plan;
    try {
      plan = JSON.parse(rawPlan);
    } catch {
      return res.status(400).json({ ok: false, message: "Trường mediaPlan không phải JSON hợp lệ." });
    }
    if (!Array.isArray(plan)) {
      return res.status(400).json({ ok: false, message: "mediaPlan phải là mảng." });
    }

    const files = req.files || [];
    let fileIndex = 0;
    const builtMedia = [];
    for (const slot of plan) {
      if (!slot || typeof slot !== "object") continue;
      if (typeof slot.url === "string" && slot.url.startsWith("/uploads/")) {
        builtMedia.push({ type: slot.type === "video" ? "video" : "image", url: slot.url });
        continue;
      }
      if (slot.new === true || slot.isNew === true) {
        const f = files[fileIndex++];
        if (!f) return res.status(400).json({ ok: false, message: "Thiếu file cho ô mediaPlan." });
        const isVideo = /^video\//.test(f.mimetype);
        builtMedia.push({
          type: isVideo ? "video" : "image",
          url: isVideo ? "/uploads/videos/" + f.filename : "/uploads/images/" + f.filename
        });
      }
    }
    if (fileIndex !== files.length) {
      return res.status(400).json({ ok: false, message: "Số file không khớp với các ô mới trong mediaPlan." });
    }

    const patch = {
      title: req.body.title ?? prev.title,
      content: req.body.content ?? prev.content,
      excerpt: req.body.excerpt ?? prev.excerpt,
      media: builtMedia,
      status: parseStatus(req),
      categoryId: req.body.categoryId,
      thumbnail: req.body.thumbnail
    };
    const updated = await articleModel.updateArticle(req.params.id, patch);
    return res.json({ ok: true, ...normalizeArticleResponse(updated) });
  } catch (err) {
    res.status(400).json({ ok: false, message: clientMessage(err, "Không cập nhật được bài viết.") });
  }
}

/**
 * DELETE /api/admin/articles/:id
 */
async function remove(req, res, next) {
  try {
    const deleted = await articleModel.deleteArticle(req.params.id);
    if (!deleted) return res.status(404).json({ ok: false, message: "Không tìm thấy bài viết." });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// ─── Public handlers (người xem) ─────────────────────────────────────────────

/**
 * GET /api/articles
 * Danh sách tóm tắt bài đã published (id, title, thumbnail, excerpt).
 */
async function listPublic(req, res, next) {
  try {
    const summaries = await articleModel.listPublicSummaries();
    res.json({ ok: true, posts: summaries, articles: summaries });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/articles/:id
 * Nội dung đầy đủ một bài đã published.
 */
async function getPublic(req, res, next) {
  try {
    const article = await articleModel.getPublishedArticle(req.params.id);
    if (!article) return res.status(404).json({ ok: false, message: "Không tìm thấy bài viết." });
    res.json({ ok: true, post: article, article });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  // Admin
  listAdmin,
  getAdmin,
  createFromMultipart,
  updateFromMultipart,
  remove,
  // Public
  listPublic,
  getPublic
};
