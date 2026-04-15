/**
 * Ghép mảng contentLayout (JSON) với file multipart theo thứ tự { type, new: true }.
 */

/**
 * @param {unknown[]} layout
 * @param {Array<{ filename?: string, mimetype?: string }>} files
 * @returns {{ layout: object[], media: object[], plainText: string }}
 */
function mergeContentLayoutWithFiles(layout, files) {
  if (!Array.isArray(layout)) {
    throw new Error("contentLayout phải là mảng.");
  }
  const fileList = files || [];
  let fi = 0;
  /** @type {object[]} */
  const resolved = [];
  /** @type {object[]} */
  const media = [];

  for (const block of layout) {
    if (!block || typeof block !== "object") continue;
    const t = block.type;
    if (t === "text") {
      resolved.push({ type: "text", text: String(block.text ?? "") });
      continue;
    }
    if (t === "image" || t === "video") {
      if (typeof block.url === "string" && block.url.startsWith("/uploads/")) {
        const type = block.type === "video" ? "video" : "image";
        resolved.push({ type, url: block.url });
        media.push({ type, url: block.url });
        continue;
      }
      if (block.new === true || block.isNew === true) {
        const f = fileList[fi++];
        if (!f) {
          throw new Error("Thiếu file cho một khối ảnh/video mới trong contentLayout.");
        }
        const isVid = /^video\//.test(String(f.mimetype || ""));
        const type = isVid ? "video" : "image";
        const url = isVid ? "/uploads/videos/" + f.filename : "/uploads/images/" + f.filename;
        resolved.push({ type, url });
        media.push({ type, url });
        continue;
      }
      throw new Error("Khối ảnh/video thiếu url hoặc new: true.");
    }
  }

  if (fi !== fileList.length) {
    throw new Error("Số file upload không khớp số vị trí new trong contentLayout.");
  }

  const plainText = resolved
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n\n");

  return { layout: resolved, media, plainText };
}

module.exports = { mergeContentLayoutWithFiles };
