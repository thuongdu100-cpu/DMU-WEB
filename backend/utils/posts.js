/**
 * Tiện ích dùng chung cho bài viết / posts (tóm tắt).
 */

function excerptFromContent(content, max = 220) {
  const plain = String(content || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!plain) return "";
  if (plain.length <= max) return plain;
  return plain.slice(0, max).trim() + "…";
}

module.exports = { excerptFromContent };
