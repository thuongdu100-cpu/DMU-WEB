/**
 * Merge contentLayout JSON array with multipart files for { new: true } slots.
 */

/**
 * @param {unknown[]} layout
 * @param {Array<{ filename?: string, mimetype?: string }>} files
 * @returns {{ layout: object[], media: object[], plainText: string }}
 */
function mergeContentLayoutWithFiles(layout, files) {
  if (!Array.isArray(layout)) {
    throw new Error("contentLayout ph\u1EA3i l\u00E0 m\u1EA3ng.");
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
          throw new Error("Thi\u1EBFu t\u1EC7p cho kh\u1ED1i \u1EA3nh/video m\u1EDBi trong contentLayout.");
        }
        const isVid = /^video\//.test(String(f.mimetype || ""));
        const type = isVid ? "video" : "image";
        const url = isVid ? "/uploads/videos/" + f.filename : "/uploads/images/" + f.filename;
        resolved.push({ type, url });
        media.push({ type, url });
        continue;
      }
      throw new Error("Kh\u1ED1i \u1EA3nh/video c\u1EA7n url ho\u1EB7c new: true.");
    }
  }

  if (fi !== fileList.length) {
    throw new Error("S\u1ED1 t\u1EC7p t\u1EA3i l\u00EAn kh\u00F4ng kh\u1EDBp s\u1ED1 \u00F4 m\u1EDBi trong contentLayout.");
  }

  const plainText = resolved
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n\n");

  return { layout: resolved, media, plainText };
}

module.exports = { mergeContentLayoutWithFiles };
