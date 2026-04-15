/**
 * Bố cục bài: đoạn chữ xen ảnh/video (contentLayout JSON trên server).
 */
import { newSlotId, mediaDisplayList } from "./articleMedia.js";

/** @typedef {{ id: string, kind: 'text', text: string }} TextBlock */
/** @typedef {{ id: string, kind: 'image'|'video', mode: 'existing'|'new', url?: string, file?: File, previewUrl?: string }} MediaBlock */

/**
 * Nội dung chữ ghép từ các khối text (khớp plainText phía server).
 * @param {Array<{ kind: string, text?: string }>} blocks
 */
export function plainTextFromBlocks(blocks) {
  if (!Array.isArray(blocks)) return "";
  return blocks
    .filter((b) => b && b.kind === "text")
    .map((b) => String(b.text ?? ""))
    .join("\n\n");
}

/**
 * @param {{ content?: string, contentLayout?: object[], media?: object[], images?: string[], videos?: string[] } | null} article
 * @returns {(TextBlock|MediaBlock)[]}
 */
export function blocksFromArticle(article) {
  if (!article) {
    return [{ id: newSlotId(), kind: "text", text: "" }];
  }
  const layout = article.contentLayout;
  if (Array.isArray(layout) && layout.length > 0) {
    /** @type {(TextBlock|MediaBlock)[]} */
    const out = [];
    for (const b of layout) {
      if (!b || typeof b !== "object") continue;
      if (b.type === "text") {
        out.push({ id: newSlotId(), kind: "text", text: String(b.text ?? "") });
        continue;
      }
      if (b.type === "image" || b.type === "video") {
        const url = typeof b.url === "string" ? b.url : "";
        if (url.startsWith("/uploads/")) {
          out.push({
            id: newSlotId(),
            kind: b.type === "video" ? "video" : "image",
            mode: "existing",
            url
          });
        }
      }
    }
    if (!out.length) {
      return [{ id: newSlotId(), kind: "text", text: article.content || "" }];
    }
    return out;
  }

  /** @type {(TextBlock|MediaBlock)[]} */
  const legacy = [];
  for (const m of mediaDisplayList(article)) {
    legacy.push({
      id: newSlotId(),
      kind: m.type === "video" ? "video" : "image",
      mode: "existing",
      url: m.url
    });
  }
  legacy.push({ id: newSlotId(), kind: "text", text: article.content || "" });
  return legacy.length ? legacy : [{ id: newSlotId(), kind: "text", text: "" }];
}

/**
 * JSON gửi API + danh sách file theo đúng thứ tự `new`.
 * @param {(TextBlock|MediaBlock)[]} blocks
 * @returns {{ layout: object[], files: File[] }}
 */
export function layoutPayloadFromBlocks(blocks) {
  if (!Array.isArray(blocks)) {
    return { layout: [], files: [] };
  }
  /** @type {object[]} */
  const layout = [];
  /** @type {File[]} */
  const files = [];

  for (const b of blocks) {
    if (!b || typeof b !== "object") continue;
    if (b.kind === "text") {
      layout.push({ type: "text", text: String(b.text ?? "") });
      continue;
    }
    if (b.kind === "image" || b.kind === "video") {
      if (b.mode === "existing" && typeof b.url === "string" && b.url.startsWith("/uploads/")) {
        layout.push({ type: b.kind, url: b.url });
        continue;
      }
      if (b.mode === "new" && b.file) {
        layout.push({ type: b.kind, new: true });
        files.push(b.file);
        continue;
      }
      throw new Error("Có khối ảnh/video chưa chọn file hoặc thiếu URL.");
    }
  }

  return { layout, files };
}
