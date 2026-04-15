/**
 * Trạng thái slot media trong form admin (ảnh/video xen kẽ, có thứ tự).
 * mode 'existing' = URL đã lưu; 'new' = file mới chọn.
 */

export function newSlotId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `s-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Từ bài API → danh sách slot để sửa */
export function slotsFromArticle(article) {
  if (!article) return [];
  if (Array.isArray(article.media) && article.media.length) {
    return article.media.map((m) => ({
      id: newSlotId(),
      kind: m.type === "video" ? "video" : "image",
      mode: "existing",
      url: m.url
    }));
  }
  const slots = [];
  (article.images || []).forEach((url) => {
    slots.push({ id: newSlotId(), kind: "image", mode: "existing", url });
  });
  (article.videos || []).forEach((url) => {
    slots.push({ id: newSlotId(), kind: "video", mode: "existing", url });
  });
  return slots;
}

/** Chuỗi ảnh/video để hiển thị bài (có thứ tự); tương thích bài cũ chỉ có images/videos. */
export function mediaDisplayList(article) {
  if (!article) return [];
  if (Array.isArray(article.media) && article.media.length) {
    return article.media.filter((m) => m && m.url && (m.type === "image" || m.type === "video"));
  }
  const out = [];
  (article.images || []).forEach((url) => out.push({ type: "image", url }));
  (article.videos || []).forEach((url) => out.push({ type: "video", url }));
  return out;
}
