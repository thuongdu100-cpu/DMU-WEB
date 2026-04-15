import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Mặc định proxy tới :3001 (cùng cổng API khuyến nghị khi dev).
 * Tránh trỏ nhầm :3000 nếu đang chạy process khác / API cũ (Multer → "Unexpected field").
 * Ghi đè bằng biến môi trường VITE_API_TARGET hoặc file `.env.development`.
 */
const apiTarget = process.env.VITE_API_TARGET || "http://localhost:3001";

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
    port: 5173,
    proxy: {
      "/api": apiProxy,
      "/uploads": apiProxy,
      "/posts": apiProxy
    }
  }
});
