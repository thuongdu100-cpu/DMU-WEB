/**
 * G\u1ECDi API backend (dev: proxy Vite; prod: c\u00F9ng origin v\u1EDBi Express).
 */

/**
 * @param {string} msg
 * @returns {string}
 */
export function normalizeClientErrorMessage(msg) {
  const m = String(msg || "").trim();
  if (!m) return "L\u1ED7i kh\u00F4ng x\u00E1c \u0111\u1ECBnh.";
  if (m.includes("Unexpected end of JSON input")) {
    return "Ph\u1EA3n h\u1ED3i t\u1EEB m\u00E1y ch\u1EE7 kh\u00F4ng ph\u1EA3i JSON h\u1EE3p l\u1EC7 (c\u00F3 th\u1EC3 tr\u1ED1ng ho\u1EB7c b\u1ECB ng\u1EAFt). Ki\u1EC3m tra API \u0111\u00E3 ch\u1EA1y.";
  }
  if (m.startsWith("Unexpected token")) {
    return "Ph\u1EA3n h\u1ED3i kh\u00F4ng ph\u1EA3i JSON h\u1EE3p l\u1EC7.";
  }
  if (m === "Failed to fetch" || m.includes("NetworkError") || m.includes("Load failed")) {
    return "Kh\u00F4ng k\u1EBFt n\u1ED1i \u0111\u01B0\u1EE3c m\u00E1y ch\u1EE7. Ki\u1EC3m tra m\u1EA1ng v\u00E0 API \u0111\u00E3 ch\u1EA1y.";
  }
  return m;
}

/**
 * @param {Response} res
 * @returns {Promise<Record<string, unknown>>}
 */
export async function readResponseJson(res) {
  const text = await res.text();
  const trimmed = text.trim();
  if (!trimmed) {
    if (res.status === 401) {
      throw new Error("C\u1EA7n \u0111\u0103ng nh\u1EADp admin.");
    }
    if (res.status >= 500 || res.status === 502 || res.status === 504) {
      throw new Error(
        `M\u00E1y ch\u1EE7 tr\u1EA3 ph\u1EA3n h\u1ED3i tr\u1ED1ng (${res.status}). Ki\u1EC3m tra backend \u0111\u00E3 ch\u1EA1y v\u00E0 upload kh\u00F4ng b\u1ECB proxy/ng\u1EAFt k\u1EBFt n\u1ED1i.`
      );
    }
    throw new Error(
      `Ph\u1EA3n h\u1ED3i tr\u1ED1ng (${res.status}). Ki\u1EC3m tra API v\u00E0 k\u1EBFt n\u1ED1i m\u1EA1ng.`
    );
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    throw new Error(
      `Ph\u1EA3n h\u1ED3i kh\u00F4ng ph\u1EA3i JSON (${res.status}). C\u00F3 th\u1EC3 proxy/dev server tr\u1EA3 trang l\u1ED7i HTML thay v\u00EC API.`
    );
  }
}

export async function api(path, options = {}) {
  const res = await fetch(path, {
    credentials: "include",
    ...options
  });
  let data;
  try {
    data = await readResponseJson(res);
  } catch (e) {
    throw new Error(normalizeClientErrorMessage(e.message));
  }
  if (!res.ok) {
    const raw = typeof data.message === "string" ? data.message : res.statusText;
    const err = new Error(normalizeClientErrorMessage(raw || "L\u1ED7i m\u1EA1ng"));
    err.status = res.status;
    throw err;
  }
  return data;
}
