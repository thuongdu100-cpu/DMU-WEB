function excerptFromContent(html) {
  const s = String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return s.length > 220 ? s.slice(0, 217) + "..." : s;
}

module.exports = { excerptFromContent };
