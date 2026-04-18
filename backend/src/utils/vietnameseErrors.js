/**
 * Chu\u1EA9n h\u00F3a th\u00F4ng b\u00E1o l\u1ED7i hi\u1EC3n th\u1ECB cho client (ti\u1EBFng Vi\u1EC7t).
 */
"use strict";

const JSON_EMPTY_HINT =
  "Ph\u1EA3n h\u1ED3i kh\u00F4ng ph\u1EA3i JSON h\u1EE3p l\u1EC7 (n\u1ED9i dung tr\u1ED1ng ho\u1EB7c b\u1ECB c\u1EAFt). Ki\u1EC3m tra API \u0111\u00E3 ch\u1EA1y v\u00E0 proxy \u0111\u00FAng.";

/**
 * @param {unknown} err
 * @param {string} [fallback]
 * @returns {string}
 */
function hasVietnameseLetter(s) {
  return /[\u00C0-\u1EF9]/i.test(String(s || ""));
}

function publicErrorMessage(err, fallback) {
  const fb = fallback || "\u0110\u00E3 x\u1EA3y ra l\u1ED7i m\u00E1y ch\u1EE7.";
  const raw = err && typeof err === "object" && "message" in err ? String(err.message || "") : String(err || "");
  const trimmed = raw.trim();
  if (!trimmed) return fb;
  const t = translateErrorString(trimmed);
  if (t !== trimmed) return t;
  if (hasVietnameseLetter(trimmed)) return trimmed;
  return fb;
}

/**
 * @param {string} raw
 * @returns {string}
 */
function translateErrorString(raw) {
  const m = String(raw || "").trim();
  if (!m) return "";

  if (m.includes("Unexpected end of JSON input")) return JSON_EMPTY_HINT;
  if (m.startsWith("Unexpected token")) {
    return "D\u1EEF li\u1EC7u kh\u00F4ng ph\u1EA3i JSON h\u1EE3p l\u1EC7.";
  }

  if (m === "Unexpected field" || m.includes("Unexpected field")) {
    return (
      "Tr\u01B0\u1EDDng form kh\u00F4ng h\u1EE3p l\u1EC7. API ph\u1EA3i d\u00F9ng busboy; ki\u1EC3m tra GET /api/health c\u00F3 uploadParser=busboy."
    );
  }

  if (m.includes("LIMIT_UNEXPECTED_FILE")) {
    return "T\u1EC7p t\u1EA3i l\u00EAn kh\u00F4ng \u0111\u00FAng \u0111\u1ECBnh d\u1EA1ng ho\u1EB7c tr\u01B0\u1EDDng file kh\u00F4ng \u0111\u01B0\u1EE3c ph\u00E9p.";
  }

  if (/prisma/i.test(m) || m.includes("PrismaClient") || m.includes("P1001") || m.includes("P2002")) {
    return "L\u1ED7i c\u01A1 s\u1EDF d\u1EEF li\u1EC7u. Ki\u1EC3m tra k\u1EBFt n\u1ED1i DATABASE_URL v\u00E0 \u0111\u00E3 ch\u1EA1y db:push.";
  }

  return m;
}

module.exports = {
  publicErrorMessage,
  translateErrorString,
  JSON_EMPTY_HINT
};
