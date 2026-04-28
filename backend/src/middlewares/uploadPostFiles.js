/**
 * Multipart: fields + file fields "media" / "media[]" via busboy.
 */
const fs = require("fs");
const path = require("path");
const busboy = require("busboy");
const appendFieldPkg = require("append-field");
const appendField =
  typeof appendFieldPkg === "function" ? appendFieldPkg : appendFieldPkg.default;
if (typeof appendField !== "function") {
  throw new Error("Kh\u00F4ng t\u1EA3i \u0111\u01B0\u1EE3c th\u01B0 vi\u1EC7n append-field.");
}
const typeIs = require("type-is");
const { pipeline } = require("stream/promises");
const config = require("../../config");
const { publicErrorMessage } = require("../utils/vietnameseErrors");

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
const videoMime = /^video\/(mp4|webm|quicktime|x-ms-wmv|x-msvideo|x-matroska|mpeg|ogg|3gpp|x-flv|avi|mov)$/i;

function isAllowedMediaFieldName(name) {
  if (name == null || typeof name !== "string") return false;
  const n = name.trim();
  if (n === "media" || n === "media[]") return true;
  return /^media(\[[^[\]]*\])+$/.test(n);
}

function unlinkQuiet(abs) {
  try {
    if (abs && fs.existsSync(abs)) fs.unlinkSync(abs);
  } catch {
    /* ignore */
  }
}

function uploadPostFiles(req, res, next) {
  if (!typeIs(req, ["multipart"])) {
    markUploadParser(res);
    return res.status(400).json({
      ok: false,
      message: "C\u1EA7n g\u1EEDi multipart/form-data."
    });
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
    return res.status(400).json({
      ok: false,
      message: publicErrorMessage(e, "Bi\u1EC3u m\u1EABu g\u1EEDi l\u00EAn kh\u00F4ng h\u1EE3p l\u1EC7.")
    });
  }

  req.body = Object.create(null);
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
    const mimeType =
      typeof info.mimeType === "string" && info.mimeType ? info.mimeType : "application/octet-stream";

    if (!isAllowedMediaFieldName(name)) {
      badFileField = badFileField || String(name || "(tr\u1ED1ng)");
      file.resume();
      return;
    }

    if (!filename) {
      file.resume();
      return;
    }

    if (mediaIndex >= MAX_MEDIA_FILES) {
      limitMessage = `T\u1ED1i \u0111a ${MAX_MEDIA_FILES} t\u1EC7p media.`;
      file.resume();
      return;
    }

    if (!imageMime.test(mimeType) && !videoMime.test(mimeType)) {
      badMimeMessage = "Lo\u1EA1i MIME kh\u00F4ng h\u1ED7 tr\u1EE3: " + mimeType;
      file.resume();
      return;
    }

    ensureDir(config.paths.uploads);
    const isVid = videoMime.test(mimeType);
    const destDir = isVid ? config.paths.uploadsVideos : config.paths.uploadsImages;
    ensureDir(destDir);

    const ext = path.extname(filename) || "";
    const storedName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`.replace(
      /[^\w.\-]/g,
      ""
    );
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
    limitMessage = limitMessage || "Qu\u00E1 nhi\u1EC1u t\u1EC7p.";
  });
  bb.on("fieldsLimit", () => {
    limitMessage = limitMessage || "Qu\u00E1 nhi\u1EC1u tr\u01B0\u1EDDng.";
  });
  bb.on("partsLimit", () => {
    limitMessage = limitMessage || "Form qu\u00E1 l\u1EDBn.";
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
        message: publicErrorMessage(streamError, "L\u1ED7i ghi t\u1EC7p t\u1EA3i l\u00EAn.")
      });
    }

    if (limitMessage) {
      return cleanupAndSend(400, { ok: false, message: limitMessage });
    }

    if (badFileField) {
      return cleanupAndSend(400, {
        ok: false,
        message: `Tr\u01B0\u1EDDng file kh\u00F4ng h\u1EE3p l\u1EC7 "${badFileField}" (d\u00F9ng "media", "media[]" ho\u1EB7c "media[...]").`
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

module.exports = { uploadPostFiles, mapMediaFiles };
