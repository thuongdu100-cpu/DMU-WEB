/**
 * Controller: REST /posts + logic dùng chung cho admin/public routes.
 */
const postModel = require("../models/post.model");
const { mapMediaFiles } = require("../middlewares/uploadPostFiles");
const { mergeContentLayoutWithFiles } = require("../utils/contentLayoutMerge");

function statusForCreate(req) {
  const s = req.body && req.body.status;
  if (s === "draft") return "draft";
  if (s === "published") return "published";
  return undefined;
}

function optionalStatus(req) {
  const s = req.body && req.body.status;
  if (s === undefined || s === null || String(s).trim() === "") return undefined;
  if (s === "draft" || s === "published") return s;
  return undefined;
}

function createFromMultipart(req, res) {
  try {
    const rawLayout = req.body.contentLayout;
    if (rawLayout != null && String(rawLayout).trim() !== "") {
      let layout;
      try {
        layout = JSON.parse(rawLayout);
      } catch {
        return res.status(400).json({ ok: false, message: "contentLayout không phải JSON hợp lệ." });
      }
      const { layout: resolved, media, plainText } = mergeContentLayoutWithFiles(layout, req.files);
      const art = postModel.createPost({
        title: req.body.title,
        content: plainText,
        excerpt: req.body.excerpt,
        media,
        contentLayout: JSON.stringify(resolved),
        status: statusForCreate(req)
      });
      return res.status(201).json({ ok: true, post: art, article: art });
    }

    const media = mapMediaFiles(req);
    const art = postModel.createPost({
      title: req.body.title,
      content: req.body.content || "",
      excerpt: req.body.excerpt,
      media,
      contentLayout: "",
      status: statusForCreate(req)
    });
    res.status(201).json({ ok: true, post: art, article: art });
  } catch (e) {
    res.status(400).json({ ok: false, message: e.message || "Lỗi tạo bài" });
  }
}

/**
 * mediaPlan: JSON mảng theo thứ tự:
 * - { type, url } — giữ file cũ
 * - { type, new: true } — lấy lần lượt file trong multipart field `media`
 */
function updateFromMultipart(req, res) {
  try {
    const prev = postModel.getById(req.params.id);
    if (!prev) return res.status(404).json({ ok: false, message: "Không tìm thấy bài." });

    const rawLayout = req.body.contentLayout;
    if (rawLayout != null && String(rawLayout).trim() !== "") {
      let layout;
      try {
        layout = JSON.parse(rawLayout);
      } catch {
        return res.status(400).json({ ok: false, message: "contentLayout không phải JSON hợp lệ." });
      }
      const { layout: resolved, media, plainText } = mergeContentLayoutWithFiles(layout, req.files);
      const patch = {
        title: req.body.title !== undefined ? req.body.title : prev.title,
        content: plainText,
        excerpt: req.body.excerpt !== undefined ? req.body.excerpt : prev.excerpt,
        media,
        contentLayout: JSON.stringify(resolved)
      };
      const st = optionalStatus(req);
      if (st !== undefined) patch.status = st;
      const updated = postModel.updatePost(req.params.id, patch);
      return res.json({ ok: true, post: updated, article: updated });
    }

    const raw = req.body.mediaPlan;
    if (raw == null || raw === "") {
      return res.status(400).json({ ok: false, message: "Thiếu mediaPlan hoặc contentLayout (JSON)." });
    }
    let plan;
    try {
      plan = JSON.parse(raw);
    } catch {
      return res.status(400).json({ ok: false, message: "mediaPlan không phải JSON hợp lệ." });
    }
    if (!Array.isArray(plan)) {
      return res.status(400).json({ ok: false, message: "mediaPlan phải là mảng." });
    }

    const files = req.files || [];
    let fi = 0;
    const built = [];

    for (const slot of plan) {
      if (!slot || typeof slot !== "object") continue;
      if (typeof slot.url === "string" && slot.url.startsWith("/uploads/")) {
        const type = slot.type === "video" ? "video" : "image";
        built.push({ type, url: slot.url });
        continue;
      }
      if (slot.new === true || slot.isNew === true) {
        const f = files[fi++];
        if (!f) {
          return res.status(400).json({ ok: false, message: "Thiếu file tương ứng trong mediaPlan." });
        }
        const isVid = /^video\//.test(f.mimetype);
        built.push({
          type: isVid ? "video" : "image",
          url: isVid ? "/uploads/videos/" + f.filename : "/uploads/images/" + f.filename
        });
      }
    }

    if (fi !== files.length) {
      return res.status(400).json({
        ok: false,
        message: "Số file upload không khớp số vị trí { new: true } trong mediaPlan."
      });
    }

    const patch = {
      title: req.body.title !== undefined ? req.body.title : prev.title,
      content: req.body.content !== undefined ? req.body.content : prev.content,
      excerpt: req.body.excerpt !== undefined ? req.body.excerpt : prev.excerpt,
      media: built
    };
    const st = optionalStatus(req);
    if (st !== undefined) patch.status = st;
    const updated = postModel.updatePost(req.params.id, patch);

    res.json({ ok: true, post: updated, article: updated });
  } catch (e) {
    res.status(400).json({ ok: false, message: e.message || "Lỗi cập nhật" });
  }
}

function listAll(req, res) {
  try {
    const posts = postModel.listPublishedPosts();
    res.json({ ok: true, posts });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message || "Lỗi" });
  }
}

function getOne(req, res) {
  const art = postModel.getPublishedById(req.params.id);
  if (!art) return res.status(404).json({ ok: false, message: "Không tìm thấy bài." });
  res.json({ ok: true, post: art });
}

function remove(req, res) {
  const ok = postModel.deletePost(req.params.id);
  if (!ok) return res.status(404).json({ ok: false, message: "Không tìm thấy bài." });
  res.json({ ok: true });
}

module.exports = {
  createFromMultipart,
  updateFromMultipart,
  listAll,
  getOne,
  remove
};
