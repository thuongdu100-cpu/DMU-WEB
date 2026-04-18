/**
 * article.model.js
 * CRUD bài viết (articles) qua Prisma.
 * Các bảng liên quan: articles, content_layout, media, content_media (schema: content, media)
 */
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { prisma } = require("../models/database");
const config = require("../../config");
const { mondayKeyFromDate, dayKeyFromDate, lastNWeekStartsOffset, lastNDaysOffset } = require("../utils/weeks");
const { excerptFromContent } = require("../utils/posts");

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Tạo slug URL-friendly từ tiêu đề bài viết.
 * Hỗ trợ tiếng Việt (loại dấu) + 6 ký tự suffix ngẫu nhiên để đảm bảo unique.
 * @param {string} text
 * @returns {string}
 */
function slugify(text) {
  const viMap = [
    [/[àáạảãâầấậẩẫăằắặẳẵ]/gi, "a"],
    [/[èéẹẻẽêềếệểễ]/gi, "e"],
    [/[ìíịỉĩ]/gi, "i"],
    [/[òóọỏõôồốộổỗơờớợởỡ]/gi, "o"],
    [/[ùúụủũưừứựửữ]/gi, "u"],
    [/[ỳýỵỷỹ]/gi, "y"],
    [/[đ]/gi, "d"]
  ];
  let s = String(text || "");
  viMap.forEach(([re, rep]) => { s = s.replace(re, rep); });
  s = s.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-")
    .slice(0, 80);
  const suffix = crypto.randomBytes(3).toString("hex");
  return s ? `${s}-${suffix}` : suffix;
}

/** Chuẩn hoá trạng thái bài viết: chỉ chấp nhận "draft" hoặc "published". */
function normalizeStatus(raw) {
  return String(raw ?? "published").trim().toLowerCase() === "draft" ? "draft" : "published";
}

/** Nếu status không được truyền → mặc định "published". */
function resolveStatusOnCreate(status) {
  if (status === undefined || status === null || String(status).trim() === "") return "published";
  return normalizeStatus(status);
}

/** Chuyển Date/string → ISO string. */
function toIso(v) {
  if (v == null) return "";
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

/** Kiểm tra media item hợp lệ (url bắt đầu /uploads/). */
function normalizeMediaItems(media) {
  if (!Array.isArray(media)) return [];
  return media.reduce((acc, m) => {
    if (!m || typeof m !== "object") return acc;
    const type = m.type === "video" ? "video" : "image";
    const url = typeof m.url === "string" ? m.url.trim() : "";
    if (url.startsWith("/uploads/")) acc.push({ type, url });
    return acc;
  }, []);
}

function splitMedia(media) {
  return {
    images: media.filter((x) => x.type === "image").map((x) => x.url),
    videos: media.filter((x) => x.type === "video").map((x) => x.url)
  };
}

function urlsFromMediaList(media) {
  return (media || []).map((x) => x.url).filter(Boolean);
}

/** Chuyển đường dẫn public /uploads/... thành đường dẫn tuyệt đối trên server. */
function publicUrlToAbsPath(publicPath) {
  if (!publicPath || typeof publicPath !== "string") return null;
  if (!publicPath.startsWith("/uploads/")) return null;
  return path.join(config.paths.uploads, publicPath.replace(/^\/uploads\//, ""));
}

/** Xoá file upload khỏi disk (bỏ qua nếu không tồn tại). */
function deleteUploadFile(url) {
  const abs = publicUrlToAbsPath(url);
  if (!abs) return;
  try { if (fs.existsSync(abs)) fs.unlinkSync(abs); } catch { /* ignore */ }
}

function deleteUploadFiles(urls) {
  (urls || []).forEach(deleteUploadFile);
}

// ─── Prisma include helpers ──────────────────────────────────────────────────

/** Include đầy đủ content_layout kèm media, sắp xếp theo vị trí. */
const layoutInclude = {
  orderBy: [{ position: "asc" }, { id: "asc" }],
  include: { content_media: { include: { media: true } } }
};

// ─── Chuyển đổi dữ liệu DB → API response ───────────────────────────────────

function baseFromRow(a) {
  if (!a) return null;
  return {
    id: a.id,
    title: a.title,
    slug: a.slug || "",
    content: a.content,
    excerpt: a.excerpt,
    status: a.status,
    thumbnail: a.thumbnail || null,
    view_count: a.view_count || 0,
    category_id: a.category_id || null,
    published_at: a.published_at || null,
    created_at: a.created_at,
    updated_at: a.updated_at
  };
}

function layoutRowsFromPrisma(layouts) {
  if (!layouts?.length) return [];
  return layouts.map((cl) => {
    const first = cl.content_media?.[0];
    return {
      type: cl.type,
      content: cl.content,
      position: cl.position,
      metadata: cl.metadata,
      media_url: first?.media?.url || ""
    };
  });
}

/**
 * Ghép base row + layout rows thành object trả về API.
 * @param {object} base
 * @param {object[]} layoutRows
 */
function toApiArticle(base, layoutRows) {
  if (!base) return null;

  const contentLayout = (layoutRows || []).map((r) => ({
    type: r.type,
    text: r.type === "text" ? String(r.content || "") : "",
    url: r.type !== "text" ? String(r.media_url || "") : "",
    alt: r.type !== "text" ? String(r.metadata?.alt || "") : ""
  }));

  const media = normalizeMediaItems(
    contentLayout
      .filter((x) => x.type === "image" || x.type === "video")
      .map((x) => ({ type: x.type, url: x.url }))
  );
  const { images, videos } = splitMedia(media);
  const plain = String(base.content || "");
  const excerpt = String(base.excerpt || "").trim() || excerptFromContent(plain);

  return {
    id: base.id,
    title: base.title,
    slug: base.slug || "",
    content: plain,
    excerpt,
    thumbnail: base.thumbnail || null,
    view_count: base.view_count || 0,
    category_id: base.category_id || null,
    published_at: base.published_at ? toIso(base.published_at) : null,
    media,
    contentLayout,
    status: normalizeStatus(base.status),
    images,
    videos,
    video: videos[0] || "",
    createdAt: toIso(base.created_at),
    updatedAt: toIso(base.updated_at)
  };
}

function rowToApiArticle(article) {
  if (!article) return null;
  return toApiArticle(baseFromRow(article), layoutRowsFromPrisma(article.content_layout));
}

// ─── Internal fetch ──────────────────────────────────────────────────────────

async function fetchArticleById(id) {
  const row = await prisma.articles.findUnique({
    where: { id },
    include: { content_layout: layoutInclude }
  });
  return rowToApiArticle(row);
}

// ─── Tạo content_layout trong transaction ────────────────────────────────────

async function buildLayoutBlocks(tx, articleId, layoutArr, mediaArr) {
  const mediaQueue = [...mediaArr];
  for (let i = 0; i < layoutArr.length; i++) {
    const b = layoutArr[i] || {};
    const type = b.type === "video" ? "video" : b.type === "image" ? "image" : "text";
    const clRow = await tx.content_layout.create({
      data: {
        article_id: articleId,
        type,
        content: type === "text" ? String(b.text || b.content || "") : "",
        position: i,
        metadata: type !== "text" ? { alt: String(b.alt || "") } : null
      }
    });
    if (type !== "text") {
      const m = mediaQueue.shift() || {};
      const mediaRow = await tx.media.create({
        data: { url: String(m.url || b.url || ""), type, filename: null, mime_type: null }
      });
      await tx.content_media.create({ data: { content_id: clRow.id, media_id: mediaRow.id } });
    }
  }
}

function buildLayoutFromMedia(content, media) {
  const blocks = [];
  if (String(content || "").trim()) {
    blocks.push({ type: "text", text: String(content) });
  }
  for (const m of normalizeMediaItems(media)) {
    blocks.push({ type: m.type, url: m.url });
  }
  return blocks;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Danh sách tất cả bài viết (dành cho admin, không lọc status).
 */
async function listArticlesAdmin() {
  const rows = await prisma.articles.findMany({
    orderBy: { updated_at: "desc" },
    include: { content_layout: layoutInclude }
  });
  return rows.map(rowToApiArticle).filter(Boolean);
}

/**
 * Danh sách bài đã published (dành cho người xem).
 */
async function listPublishedArticles() {
  const rows = await prisma.articles.findMany({
    where: { status: "published" },
    orderBy: { updated_at: "desc" },
    include: { content_layout: layoutInclude }
  });
  return rows.map(rowToApiArticle).filter(Boolean);
}

/**
 * Lấy bài viết bất kỳ theo id (admin).
 * @param {number|string} rawId
 */
async function getArticleById(rawId) {
  const id = parseInt(rawId, 10);
  if (!Number.isFinite(id)) return null;
  return fetchArticleById(id);
}

/**
 * Lấy bài đã published theo id (người xem).
 * @param {number|string} rawId
 */
async function getPublishedArticle(rawId) {
  const article = await getArticleById(rawId);
  if (!article || article.status !== "published") return null;
  return article;
}

/**
 * Danh sách tóm tắt bài published (id, title, thumbnail, excerpt).
 */
async function listPublicSummaries() {
  const rows = await listPublishedArticles();
  return rows.map((a) => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    thumbnail: a.thumbnail || (a.media?.find((m) => m.type === "image"))?.url || null,
    excerpt: String(a.excerpt || "").trim() || excerptFromContent(a.content),
    createdAt: a.createdAt,
    updatedAt: a.updatedAt
  }));
}

/**
 * Tạo bài viết mới.
 */
async function createArticle({ title, content, excerpt, media, contentLayout, status, authorId, categoryId, thumbnail }) {
  const titleOut = String(title || "").trim().slice(0, 500);
  if (!titleOut) throw new Error("Thiếu tiêu đề bài viết.");

  const body = String(content || "");
  const excerptOut = String(excerpt || "").trim().slice(0, 2000) || excerptFromContent(body);
  const mediaArr = normalizeMediaItems(media);
  const statusOut = resolveStatusOnCreate(status);
  const now = new Date();
  const slugOut = slugify(titleOut);

  let layout =
    contentLayout != null && String(contentLayout).trim() !== ""
      ? JSON.parse(String(contentLayout))
      : [];
  if (!layout.length && mediaArr.length) {
    layout = buildLayoutFromMedia(body, mediaArr);
  }

  const articleId = await prisma.$transaction(async (tx) => {
    const authorIdNum = toIntOrNull(authorId);
    const categoryIdNum = toIntOrNull(categoryId);

    const created = await tx.articles.create({
      data: {
        title: titleOut,
        slug: slugOut,
        status: statusOut,
        content: body,
        excerpt: excerptOut,
        thumbnail: thumbnail || null,
        published_at: statusOut === "published" ? now : null,
        created_at: now,
        updated_at: now,
        ...(authorIdNum != null ? { author_id: authorIdNum } : {}),
        ...(categoryIdNum != null ? { category_id: categoryIdNum } : {})
      }
    });
    await buildLayoutBlocks(tx, created.id, layout, mediaArr);
    return created.id;
  });

  return fetchArticleById(articleId);
}

/**
 * Cập nhật bài viết.
 */
async function updateArticle(rawId, { title, content, excerpt, media, contentLayout, status, categoryId, thumbnail }) {
  const prev = await getArticleById(rawId);
  if (!prev) return null;

  const now = new Date();
  const next = { ...prev };

  if (title !== undefined) next.title = String(title).trim().slice(0, 500);
  if (content !== undefined) next.content = String(content);
  if (excerpt !== undefined) {
    next.excerpt = String(excerpt).trim().slice(0, 2000) || excerptFromContent(next.content);
  }
  if (status != null && String(status).trim() !== "") {
    next.status = normalizeStatus(status);
  }
  if (media !== undefined) next.media = normalizeMediaItems(media);
  if (!next.title) throw new Error("Thiếu tiêu đề bài viết.");

  const mediaArr = normalizeMediaItems(next.media);
  let layoutOut;
  if (contentLayout != null && String(contentLayout).trim() !== "") {
    layoutOut = JSON.parse(String(contentLayout));
  } else if (media !== undefined) {
    layoutOut = buildLayoutFromMedia(next.content, mediaArr);
  }

  await prisma.$transaction(async (tx) => {
    const updateData = {
      title: next.title,
      content: next.content,
      excerpt: next.excerpt || excerptFromContent(next.content),
      status: next.status,
      updated_at: now
    };
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail || null;
    if (categoryId !== undefined) updateData.category_id = toIntOrNull(categoryId);
    if (next.status === "published" && !prev.published_at) {
      updateData.published_at = now;
    }
    await tx.articles.update({ where: { id: prev.id }, data: updateData });

    if (layoutOut !== undefined) {
      // Xoá media cũ khỏi disk
      deleteUploadFiles(urlsFromMediaList(prev.media || []));

      // Xoá layout + media records cũ
      const existingLayouts = await tx.content_layout.findMany({
        where: { article_id: prev.id },
        include: { content_media: { select: { media_id: true } } }
      });
      const mediaIds = existingLayouts
        .flatMap((l) => l.content_media.map((cm) => cm.media_id))
        .filter(Boolean);
      if (mediaIds.length) await tx.media.deleteMany({ where: { id: { in: mediaIds } } });
      await tx.content_layout.deleteMany({ where: { article_id: prev.id } });

      // Tạo layout mới
      await buildLayoutBlocks(tx, prev.id, layoutOut, mediaArr);
    }
  });

  return fetchArticleById(prev.id);
}

/**
 * Xoá bài viết (và file media liên quan).
 * @returns {boolean} true nếu xoá thành công
 */
async function deleteArticle(rawId) {
  const prev = await getArticleById(rawId);
  if (!prev) return false;

  const urls = urlsFromMediaList(prev.media || []).length
    ? urlsFromMediaList(prev.media)
    : [...(prev.images || []), ...(prev.videos || [])];
  deleteUploadFiles(urls);

  const full = await prisma.articles.findUnique({
    where: { id: prev.id },
    include: { content_layout: { include: { content_media: { select: { media_id: true } } } } }
  });
  const mediaIds = (full?.content_layout || [])
    .flatMap((l) => l.content_media.map((cm) => cm.media_id))
    .filter(Boolean);

  await prisma.$transaction(async (tx) => {
    await tx.articles.delete({ where: { id: prev.id } });
    if (mediaIds.length) await tx.media.deleteMany({ where: { id: { in: mediaIds } } });
  });

  return true;
}

// ─── Analytics ───────────────────────────────────────────────────────────────

async function weeklyArticleCounts(weeks, blocksBack) {
  const rows = await prisma.articles.findMany({
    where: { status: "published" },
    select: { updated_at: true, created_at: true }
  });
  const buckets = {};
  rows.forEach((r) => {
    const k = mondayKeyFromDate(r.updated_at || r.created_at);
    if (k) buckets[k] = (buckets[k] || 0) + 1;
  });
  return lastNWeekStartsOffset(weeks, blocksBack || 0).map(({ key, label }) => ({
    weekKey: key, label, count: buckets[key] || 0
  }));
}

async function dailyArticleCounts(days, blocksBack) {
  const rows = await prisma.articles.findMany({
    where: { status: "published" },
    select: { updated_at: true, created_at: true }
  });
  const buckets = {};
  rows.forEach((r) => {
    const k = dayKeyFromDate(r.updated_at || r.created_at);
    if (k) buckets[k] = (buckets[k] || 0) + 1;
  });
  return lastNDaysOffset(days, blocksBack || 0).map(({ key, label }) => ({
    weekKey: key, label, count: buckets[key] || 0
  }));
}

// ─── Utility ─────────────────────────────────────────────────────────────────

/** Parse số nguyên hoặc trả null. */
function toIntOrNull(v) {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

module.exports = {
  listArticlesAdmin,
  listPublishedArticles,
  getArticleById,
  getPublishedArticle,
  listPublicSummaries,
  createArticle,
  updateArticle,
  deleteArticle,
  weeklyArticleCounts,
  dailyArticleCounts,
  // Helpers dùng lại ở nơi khác
  excerptFromContent,
  normalizeMediaItems
};
