/**
 * Model: CRUD posts trong SQLite + xóa file upload khi bỏ khỏi bài / xóa bài.
 * Trường `media`: JSON mảng [{ type: 'image'|'video', url }] — thứ tự = thứ tự hiển thị trong bài.
 */
const fs = require("fs");
const path = require("path");
const { getDb } = require("./database");
const config = require("../config");
const { mondayKeyFromDate, lastNWeekStartsOffset } = require("../utils/weeks");
const { excerptFromContent } = require("../utils/posts");

function safeJson(text, fallback) {
  if (text == null || text === "") return fallback;
  try {
    const v = JSON.parse(text);
    return Array.isArray(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

function normalizeMediaItems(media) {
  if (!Array.isArray(media)) return [];
  const out = [];
  for (const m of media) {
    if (!m || typeof m !== "object") continue;
    const type = m.type === "video" ? "video" : "image";
    const url = typeof m.url === "string" ? m.url.trim() : "";
    if (!url.startsWith("/uploads/")) continue;
    out.push({ type, url });
  }
  return out;
}

function legacyMediaFromRow(images, videos) {
  const m = [];
  (images || []).forEach((url) => m.push({ type: "image", url }));
  (videos || []).forEach((url) => m.push({ type: "video", url }));
  return m;
}

function urlsFromMediaList(media) {
  return (media || []).map((x) => x.url).filter(Boolean);
}

function uploadsPublicToAbs(publicPath) {
  if (!publicPath || typeof publicPath !== "string") return null;
  if (!publicPath.startsWith("/uploads/")) return null;
  const rel = publicPath.replace(/^\/uploads\//, "");
  return path.join(config.paths.uploads, rel);
}

function unlinkPublicUrl(url) {
  const abs = uploadsPublicToAbs(url);
  if (!abs) return;
  try {
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  } catch {
    /* ignore */
  }
}

function removeUploadedUrls(urls) {
  (urls || []).forEach(unlinkPublicUrl);
}

function normalizePostStatus(raw) {
  const t = String(raw ?? "published")
    .trim()
    .toLowerCase();
  return t === "draft" ? "draft" : "published";
}

function parseContentLayoutColumn(row) {
  const raw = row.content_layout;
  if (raw == null || String(raw).trim() === "") return [];
  try {
    const v = JSON.parse(String(raw));
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function rowToArticle(row) {
  if (!row) return null;
  const imgLegacy = safeJson(row.images, []);
  const vidLegacy = safeJson(row.videos, []);
  const mediaRaw = safeJson(row.media, []);
  let media = normalizeMediaItems(Array.isArray(mediaRaw) ? mediaRaw : []);
  if (!media.length) {
    media = legacyMediaFromRow(imgLegacy, vidLegacy);
  }
  const images = media.filter((x) => x.type === "image").map((x) => x.url);
  const videos = media.filter((x) => x.type === "video").map((x) => x.url);
  const ex = String(row.excerpt || "").trim();
  const contentLayout = parseContentLayoutColumn(row);
  return {
    id: row.id,
    title: row.title,
    content: row.content || "",
    excerpt: ex || excerptFromContent(row.content),
    media,
    contentLayout,
    status: normalizePostStatus(row.status),
    images,
    videos,
    video: videos[0] || "",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

function listPostsAdmin() {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM posts ORDER BY datetime(updatedAt) DESC").all();
  return rows.map(rowToArticle);
}

function listPublishedPosts() {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM posts WHERE status = 'published' ORDER BY datetime(updatedAt) DESC")
    .all();
  return rows.map(rowToArticle);
}

function getById(rawId) {
  const id = parseInt(rawId, 10);
  if (!Number.isFinite(id)) return null;
  const db = getDb();
  const row = db.prepare("SELECT * FROM posts WHERE id = ?").get(id);
  return rowToArticle(row);
}

function deriveLegacyArrays(mediaArr) {
  const images = mediaArr.filter((m) => m.type === "image").map((m) => m.url);
  const videos = mediaArr.filter((m) => m.type === "video").map((m) => m.url);
  return { images, videos };
}

function resolveStatusOnCreate(status) {
  if (status === undefined || status === null || String(status).trim() === "") return "published";
  return normalizePostStatus(status);
}

function createPost({ title, content, excerpt, media, contentLayout, status }) {
  const db = getDb();
  const now = new Date().toISOString();
  const body = String(content || "");
  const ex = String(excerpt || "").trim().slice(0, 2000);
  const mediaArr = normalizeMediaItems(media);
  const { images, videos } = deriveLegacyArrays(mediaArr);
  const t = String(title || "").trim().slice(0, 500);
  if (!t) throw new Error("Thiếu tiêu đề");

  const excerptOut = ex || excerptFromContent(body);
  const layoutStr =
    contentLayout !== undefined && contentLayout !== null ? String(contentLayout) : "";
  const statusOut = resolveStatusOnCreate(status);
  const result = db
    .prepare(
      `INSERT INTO posts (title, content, excerpt, images, videos, media, content_layout, requiresLogin, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`
    )
    .run(
      t,
      body,
      excerptOut,
      JSON.stringify(images),
      JSON.stringify(videos),
      JSON.stringify(mediaArr),
      layoutStr,
      statusOut,
      now,
      now
    );

  return getById(Number(result.lastInsertRowid));
}

function diffRemovedUrls(prevList, nextList) {
  const n = new Set(nextList || []);
  return (prevList || []).filter((p) => !n.has(p));
}

function updatePost(rawId, { title, content, excerpt, media, contentLayout, status }) {
  const prev = getById(rawId);
  if (!prev) return null;

  const db = getDb();
  const now = new Date().toISOString();
  const next = { ...prev };

  if (title !== undefined) next.title = String(title).trim().slice(0, 500);
  if (content !== undefined) next.content = String(content);
  if (excerpt !== undefined) {
    const ex = String(excerpt).trim().slice(0, 2000);
    next.excerpt = ex || excerptFromContent(next.content);
  }

  if (status !== undefined && status !== null && String(status).trim() !== "") {
    next.status = normalizePostStatus(status);
  }

  if (media !== undefined) {
    const mediaArr = normalizeMediaItems(media);
    const prevUrls = urlsFromMediaList(prev.media || []);
    const nextUrls = urlsFromMediaList(mediaArr);
    removeUploadedUrls(diffRemovedUrls(prevUrls, nextUrls));
    next.media = mediaArr;
    const derived = deriveLegacyArrays(mediaArr);
    next.images = derived.images;
    next.videos = derived.videos;
  }

  if (!next.title) throw new Error("Thiếu tiêu đề");

  const mediaArr = normalizeMediaItems(next.media);
  const { images, videos } = deriveLegacyArrays(mediaArr);
  const layoutOut =
    contentLayout !== undefined && contentLayout !== null ? String(contentLayout) : undefined;

  if (layoutOut !== undefined) {
    db.prepare(
      `UPDATE posts SET title=?, content=?, excerpt=?, images=?, videos=?, media=?, content_layout=?, requiresLogin=?, status=?, updatedAt=? WHERE id=?`
    ).run(
      next.title,
      next.content,
      next.excerpt || excerptFromContent(next.content),
      JSON.stringify(images),
      JSON.stringify(videos),
      JSON.stringify(mediaArr),
      layoutOut,
      0,
      next.status,
      now,
      prev.id
    );
  } else {
    db.prepare(
      `UPDATE posts SET title=?, content=?, excerpt=?, images=?, videos=?, media=?, requiresLogin=?, status=?, updatedAt=? WHERE id=?`
    ).run(
      next.title,
      next.content,
      next.excerpt || excerptFromContent(next.content),
      JSON.stringify(images),
      JSON.stringify(videos),
      JSON.stringify(mediaArr),
      0,
      next.status,
      now,
      prev.id
    );
  }

  return getById(prev.id);
}

function deletePost(rawId) {
  const prev = getById(rawId);
  if (!prev) return false;
  const urls = urlsFromMediaList(prev.media || []).length
    ? urlsFromMediaList(prev.media)
    : [].concat(prev.images || [], prev.videos || []);
  removeUploadedUrls(urls);
  const db = getDb();
  db.prepare("DELETE FROM posts WHERE id = ?").run(prev.id);
  return true;
}

function normalizeArticle(a) {
  if (!a) return a;
  return {
    ...a,
    excerpt: String(a.excerpt || "").trim() || excerptFromContent(a.content)
  };
}

function toPublicSummary(a) {
  const n = normalizeArticle(a);
  const thumb =
    (n.media && n.media.find((m) => m.type === "image"))?.url ||
    (n.images && n.images[0]) ||
    null;
  return {
    id: n.id,
    title: n.title,
    thumbnail: thumb,
    excerpt: n.excerpt,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt
  };
}

function listPublicSummaries() {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM posts WHERE status = 'published' ORDER BY datetime(updatedAt) DESC")
    .all();
  return rows.map(rowToArticle).map(toPublicSummary);
}

/** GET /posts/:id công khai — chỉ bài đã xuất bản */
function getPublishedById(rawId) {
  const a = getById(rawId);
  if (!a || a.status !== "published") return null;
  return a;
}

function weeklyArticleCounts(weeks, blocksBack) {
  const db = getDb();
  const rows = db.prepare("SELECT createdAt FROM posts WHERE status = 'published'").all();
  const buckets = {};
  rows.forEach((r) => {
    const k = mondayKeyFromDate(r.createdAt);
    if (!k) return;
    buckets[k] = (buckets[k] || 0) + 1;
  });
  const template = lastNWeekStartsOffset(weeks, blocksBack || 0);
  return template.map(({ key, label }) => ({
    weekKey: key,
    label,
    count: buckets[key] || 0
  }));
}

module.exports = {
  listPostsAdmin,
  listPublishedPosts,
  getById,
  getPublishedById,
  createPost,
  updatePost,
  deletePost,
  listPublicSummaries,
  weeklyArticleCounts,
  excerptFromContent,
  normalizeMediaItems
};
