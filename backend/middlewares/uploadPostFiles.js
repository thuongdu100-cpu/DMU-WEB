/**
 * Multipart: text + file field "media" / "media[]".
 * Parse bằng busboy + ghi đĩa — không dùng multer để tránh LIMIT_UNEXPECTED_FILE ("Unexpected field").
 */
const fs = require("fs");
const path = require("path");
const busboy = require("busboy");
const appendField = require("append-field");
const typeIs = require("type-is");
const { pipeline } = require("stream/promises");
const config = require("../config");

const MAX_MEDIA_FILES = 24;

function markUploadParser(res) {
  try {
    res.setHeader("X-DMU-Upload-Parser", "busboy");
  } catch {
    /* ignore */
  }
}

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

const imageMime = /^image\/(jpeg|pjpeg|png|x-png|gif|webp|bmp|tiff|avif)$/i;
const videoMime = /^video\/(mp4|webm|quicktime|x-ms-wmv)$/i;

function isAllowedMediaFieldName(name) {
  if (name == null || typeof name !== "string") return false;
  const n = name.trim();
  return n === "media" || n === "media[]";
}

function unlinkQuiet(abs) {
  try {
    if (abs && fs.existsSync(abs)) fs.unlinkSync(abs);
  } catch {
    /* ignore */
  }
}

/**
 * Đọc multipart → req.body (text) + req.files (ảnh/video đã lưu, đúng thứ tự).
 */
function uploadPostFiles(req, res, next) {
  if (!typeIs(req, ["multipart"])) {
    markUploadParser(res);
    return res.status(400).json({ ok: false, message: "Cần gửi multipart/form-data." });
  }

  let bb;
  try {
    bb = busboy({
      headers: req.headers,
      limits: {
        fileSize: 80 * 1024 * 1024,
        files: MAX_MEDIA_FILES,
        fieldSize: 5 * 1024 * 1024,
        fields: 80,
        parts: 200
      }
    });
  } catch (e) {
    markUploadParser(res);
    return res.status(400).json({ ok: false, message: e.message || "Không đọc được form." });
  }

  req.body = Object.create(null);

  /** @type {Array<{ fieldname: string, filename: string, mimetype: string, path: string } | null>} */
  const ordered = [];
  const writePromises = [];

  let badFileField = null;
  let badMimeMessage = null;
  let limitMessage = null;
  let streamError = null;
  let mediaIndex = 0;
  let responded = false;

  function cleanupAndSend(status, payload) {
    if (responded) return;
    responded = true;
    for (const rec of ordered) {
      if (rec && rec.path) unlinkQuiet(rec.path);
    }
    markUploadParser(res);
    res.status(status).json(payload);
  }

  bb.on("field", (name, val) => {
    appendField(req.body, name, val);
  });

  bb.on("file", (name, file, info) => {
    const filename = info.filename;
    const mimeType = typeof info.mimeType === "string" && info.mimeType ? info.mimeType : "application/octet-stream";

    if (!isAllowedMediaFieldName(name)) {
      badFileField = badFileField || String(name || "(tên field trống)");
      file.resume();
      return;
    }

    if (!filename) {
      file.resume();
      return;
    }

    if (mediaIndex >= MAX_MEDIA_FILES) {
      limitMessage = `Tối đa ${MAX_MEDIA_FILES} file media.`;
      file.resume();
      return;
    }

    if (!imageMime.test(mimeType) && !videoMime.test(mimeType)) {
      badMimeMessage =
        "Định dạng không được hỗ trợ (" +
        mimeType +
        "). Ảnh: JPEG/PNG/GIF/WebP/AVIF/BMP/TIFF; video: MP4/WebM/MOV/WMV. HEIC: xuất JPEG trước.";
      file.resume();
      return;
    }

    ensureDir(config.paths.uploads);
    const isVid = videoMime.test(mimeType);
    const destDir = isVid ? config.paths.uploadsVideos : config.paths.uploadsImages;
    ensureDir(destDir);

    const ext = path.extname(filename) || "";
    const storedName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`.replace(/[^\w.\-]/g, "");
    const absPath = path.join(destDir, storedName);
    const out = fs.createWriteStream(absPath);

    const idx = mediaIndex;
    mediaIndex += 1;
    ordered[idx] = { fieldname: name, filename: storedName, mimetype: mimeType, path: absPath };

    const p = pipeline(file, out).catch((err) => {
      streamError = streamError || err;
      unlinkQuiet(absPath);
      ordered[idx] = null;
    });
    writePromises.push(p);
  });

  bb.on("filesLimit", () => {
    limitMessage = limitMessage || `Quá ${MAX_MEDIA_FILES} file.`;
  });

  bb.on("fieldsLimit", () => {
    limitMessage = limitMessage || "Quá nhiều trường text trong form.";
  });

  bb.on("partsLimit", () => {
    limitMessage = limitMessage || "Form quá lớn (quá nhiều phần multipart).";
  });

  bb.on("error", (err) => {
    streamError = streamError || err;
  });

  bb.on("close", async () => {
    try {
      await Promise.all(writePromises);
    } catch (e) {
      streamError = streamError || e;
    }

    if (responded) return;

    if (streamError) {
      return cleanupAndSend(400, {
        ok: false,
        message: streamError.message || "Lỗi khi ghi file upload."
      });
    }

    if (limitMessage) {
      return cleanupAndSend(400, { ok: false, message: limitMessage });
    }

    if (badFileField) {
      return cleanupAndSend(400, {
        ok: false,
        message: `Tên field file không hợp lệ: "${badFileField}" (chỉ dùng "media" hoặc "media[]").`
      });
    }

    if (badMimeMessage) {
      return cleanupAndSend(400, { ok: false, message: badMimeMessage });
    }

    const files = ordered.filter(Boolean);
    req.files = files.map((f) => ({
      fieldname: f.fieldname,
      originalname: f.filename,
      encoding: "binary",
      mimetype: f.mimetype,
      filename: f.filename,
      path: f.path,
      destination: path.dirname(f.path),
      size: 0
    }));

    markUploadParser(res);
    next();
  });

  req.pipe(bb);
}

/** Map file đã lưu → { type, url } theo thứ tự */
function mapMediaFiles(req) {
  const files = req.files || [];
  return files.map((f) => {
    const isVid = /^video\//.test(f.mimetype);
    return {
      type: isVid ? "video" : "image",
      url: isVid ? "/uploads/videos/" + f.filename : "/uploads/images/" + f.filename
    };
  });
}

console.log("[DMU] uploadPostFiles: multipart qua busboy (không dùng multer).");

module.exports = { uploadPostFiles, mapMediaFiles };
