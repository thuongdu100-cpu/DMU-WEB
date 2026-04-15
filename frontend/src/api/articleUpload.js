/**
 * FormData bài viết (multipart): contentLayout (JSON) + field `media` theo thứ tự { new: true }.
 * Dùng chung AdminArticleNew / AdminArticleEdit để logic upload nhất quán.
 */
import { readResponseJson } from "./client.js";
import { layoutPayloadFromBlocks, plainTextFromBlocks } from "../utils/articleLayout.js";

/** Phản hồi từ server khác DMU busboy (thường do proxy trỏ nhầm cổng / API cũ). */
const UNEXPECTED_FIELD_HINT =
  "Lỗi “Unexpected field” thường do trình duyệt đang gọi nhầm API không phải bản DMU (busboy). " +
  "Mở /api/health trên cùng host (vd. http://localhost:5173/api/health) — trường uploadParser phải là busboy. " +
  "Nếu không: chỉ chạy API trên 3001 (`$env:PORT=3001; npm run server` hoặc `npm run dev` từ thư mục gốc dự án), " +
  "và đảm bảo Vite proxy trỏ tới đúng cổng đó (mặc định đã là 3001; file frontend/.env.development).";

function humanizeUploadErrorMessage(raw) {
  const m = String(raw ?? "").trim();
  if (!m) return "Yêu cầu không thành công.";
  if (m === "Unexpected field" || m.includes("Unexpected field")) {
    return UNEXPECTED_FIELD_HINT;
  }
  return m;
}

const NETWORK_HINT =
  "Không kết nối được API khi tải file lên (Failed to fetch). " +
  "Chạy backend (mặc định dev: cổng 3001): từ thư mục gốc `npm run dev` hoặc `npm run server` với PORT=3001. " +
  "Nếu chỉ chạy Vite trong frontend, cần API đang lắng nghe trùng với VITE_API_TARGET (xem frontend/.env.development).";

/**
 * @param {FormData} formData
 * @param {File[]} files
 */
export function appendMediaFilesInOrder(formData, files) {
  for (const f of files || []) {
    if (f) formData.append("media", f, f.name || "upload");
  }
}

/**
 * @param {{ title: string, excerpt: string, blocks: unknown[], status?: 'draft'|'published' }} p
 */
export function buildNewArticleFormData({ title, excerpt, blocks, status }) {
  const { layout, files } = layoutPayloadFromBlocks(blocks);
  const fd = new FormData();
  fd.append("title", title);
  fd.append("content", plainTextFromBlocks(blocks));
  fd.append("excerpt", excerpt);
  fd.append("contentLayout", JSON.stringify(layout));
  appendMediaFilesInOrder(fd, files);
  if (status === "draft" || status === "published") fd.append("status", status);
  return fd;
}

/**
 * @param {{ title: string, excerpt: string, blocks: unknown[], status?: 'draft'|'published' }} p
 */
export function buildEditArticleFormData({ title, excerpt, blocks, status }) {
  const { layout, files } = layoutPayloadFromBlocks(blocks);
  const fd = new FormData();
  fd.append("title", title);
  fd.append("content", plainTextFromBlocks(blocks));
  fd.append("excerpt", excerpt);
  fd.append("contentLayout", JSON.stringify(layout));
  appendMediaFilesInOrder(fd, files);
  if (status === "draft" || status === "published") fd.append("status", status);
  return fd;
}

/**
 * POST/PUT multipart tới admin API; bọc fetch để báo lỗi rõ khi proxy/ngắt kết nối.
 * @param {string} url
 * @param {{ method: string, formData: FormData }} opts
 */
export async function submitAdminArticleMultipart(url, { method, formData }) {
  let res;
  try {
    res = await fetch(url, { method, credentials: "include", body: formData });
  } catch (e) {
    const msg = e && e.message ? String(e.message) : "";
    if (msg === "Failed to fetch" || e instanceof TypeError) {
      throw new Error(NETWORK_HINT);
    }
    throw e;
  }
  const data = await readResponseJson(res);
  if (!res.ok) {
    const raw = typeof data.message === "string" ? data.message : typeof data.error === "string" ? data.error : "";
    throw new Error(humanizeUploadErrorMessage(raw) || `Lỗi ${res.status}`);
  }
  return data;
}
