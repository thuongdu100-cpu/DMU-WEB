/**
 * DMU API entrypoint. Kiến trúc: docs/ARCHITECTURE.md
 * Kiem tra DB: GET /api/db-ping (dang ky trong src/app.js).
 */
const config = require("./config");
const { connectDatabase } = require("./src/models/database");
const { buildApp } = require("./src/app");

async function main() {
  await connectDatabase();

  const app = buildApp();

  const server = app.listen(config.port, () => {
    server.requestTimeout = 0;
    console.log(`API + Prisma   http://localhost:${config.port}`);
    const distIndex = require("path").join(config.paths.dist, "index.html");
    if (require("fs").existsSync(distIndex)) {
      console.log(`SPA (bản build) http://localhost:${config.port}/`);
    } else {
      console.log("Giao diện dev: chạy npm run dev (Vite + API).");
    }
    console.log(`Đăng nhập admin  POST /api/admin/auth/login`);
    console.log(`Bài viết (REST)  GET/POST/PUT/DELETE /posts`);
    console.log(`S\u1EE9c kh\u1ECFe API  GET /api/health`);
    console.log(`DB ping       GET /api/db-ping`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `C\u1ED5ng ${config.port} \u0111ang \u0111\u01B0\u1EE3c d\u00F9ng (EADDRINUSE).\n` +
          `  - Ch\u1EA1y full stack: npm run dev (API + Vite)\n` +
          `  - Ch\u1EC9 API: \u0111\u00F3ng ti\u1EBFn tr\u00ECnh kh\u00E1c ho\u1EB7c \u0111\u1ED5i PORT; Windows: netstat -ano | findstr :${config.port}`
      );
      process.exit(1);
    }
    console.error(err);
    process.exit(1);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
