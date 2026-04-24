const KNOWN_STATUSES = new Set(["draft", "pending", "published", "rejected"]);

/**
 * Normalize status value from API and warn on unexpected values.
 * @param {unknown} rawStatus
 */
export function normalizeArticleStatus(rawStatus) {
  const status = String(rawStatus || "draft").trim().toLowerCase();
  if (!KNOWN_STATUSES.has(status)) {
    console.warn("[articleStatus] Unknown status from API:", rawStatus);
    return "draft";
  }
  return status;
}

/**
 * @param {unknown} rawStatus
 */
export function articleStatusPillClass(rawStatus) {
  const status = normalizeArticleStatus(rawStatus);
  if (status === "published") return "admin-status-pill--live";
  if (status === "pending") return "admin-status-pill--pending";
  if (status === "rejected") return "admin-status-pill--rejected";
  return "admin-status-pill--draft";
}

/**
 * @param {unknown} rawStatus
 */
export function articleStatusLabel(rawStatus) {
  const status = normalizeArticleStatus(rawStatus);
  if (status === "published") return "Đã đăng";
  if (status === "pending") return "Chờ duyệt";
  if (status === "rejected") return "Từ chối";
  return "Nháp";
}

/**
 * @param {unknown} rawStatus
 */
export function isPublishedStatus(rawStatus) {
  return normalizeArticleStatus(rawStatus) === "published";
}
