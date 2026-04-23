import os from "node:os";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Mặc định proxy tới :3001 (cùng cổng API khuyến nghị khi dev).
 * Tránh trỏ nhầm :3000 nếu đang chạy process khác / API cũ (Multer → "Unexpected field").
 * Ghi đè bằng VITE_API_TARGET hoặc `.env.development`.
 * Khi không ghi đè: ưu tiên IPv4 LAN đầu tiên (cùng máy chạy Vite) để đồng bộ với bind 0.0.0.0 của API;
 * không có thì dùng 127.0.0.1.
 */
function firstLanIPv4() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      const v4 = net && (net.family === "IPv4" || net.family === 4);
      if (v4 && !net.internal) return net.address;
    }
  }
  return null;
}

const apiPort = String(process.env.VITE_API_PORT || process.env.PORT || "3001").trim() || "3001";
const apiTarget =
  process.env.VITE_API_TARGET ||
  (() => {
    const lan = firstLanIPv4();
    return lan ? `http://${lan}:${apiPort}` : `http://127.0.0.1:${apiPort}`;
  })();

/**
 * Không đặt proxyTimeout/timeout: http-proxy sẽ gọi proxyReq.abort() sau N ms,
 * dễ gây write ECONNABORTED khi upload ảnh/video lớn (Vite log: http proxy error).
 */
const apiProxy = {
  target: apiTarget,
  changeOrigin: true
};

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      "/api": apiProxy,
      "/uploads": apiProxy,
      "/posts": apiProxy
    }
  }
});
