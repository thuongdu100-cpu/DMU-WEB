/**
 * Gọi API backend (dev: proxy Vite; prod: cùng origin với Express).
 */
export async function api(path, options = {}) {
  const res = await fetch(path, {
    credentials: "include",
    ...options
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || res.statusText || "Lỗi mạng");
    err.status = res.status;
    throw err;
  }
  return data;
}

/**
 * Đọc JSON từ Response an toàn — tránh "Unexpected end of JSON input" khi body rỗng/HTML (proxy lỗi, upload lớn, API tắt).
 * @param {Response} res
 * @returns {Promise<Record<string, unknown>>}
 */
export async function readResponseJson(res) {
  const text = await res.text();
  const trimmed = text.trim();
  if (!trimmed) {
    if (res.status === 401) {
      throw new Error("Cần đăng nhập admin.");
    }
    if (res.status >= 500 || res.status === 502 || res.status === 504) {
      throw new Error(
        `Máy chủ trả phản hồi rỗng (${res.status}). Kiểm tra backend đã chạy và upload không bị proxy/ngắt kết nối.`
      );
    }
    throw new Error(`Phản hồi rỗng (${res.status}). Kiểm tra API và kết nối mạng.`);
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    throw new Error(
      `Phản hồi không phải JSON (${res.status}). Có thể proxy/dev server trả trang lỗi HTML thay vì API.`
    );
  }
}
