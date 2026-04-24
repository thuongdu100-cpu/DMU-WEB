/**
 * Chuẩn hoá role từ DB / session: admin | editor | contributor.
 * Hỗ trợ giá trị legacy (owner, moderator, …) trong giai đoạn chuyển đổi.
 */
"use strict";

/**
 * @param {string | undefined | null} raw
 * @returns {"admin"|"editor"|"contributor"}
 */
function normalizeAdminRole(raw) {
  const r = String(raw || "").trim().toLowerCase();
  if (r === "admin" || r === "owner") return "admin";
  if (r === "moderator") return "editor";
  if (r === "contributor") return "contributor";
  if (r === "editor") return "editor";
  if (r === "bot") return "contributor";
  return "contributor";
}

module.exports = { normalizeAdminRole };
