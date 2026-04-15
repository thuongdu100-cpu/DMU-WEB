const express = require("express");
const path = require("path");
const session = require("express-session");
const fs = require("fs");
const config = require("./config");
const publicArticlesApi = require("./routes/api/publicArticles.routes");
const healthApi = require("./routes/api/health.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const adminAuthRoutes = require("./routes/admin/adminAuth.routes");
const adminStatsRoutes = require("./routes/admin/adminStats.routes");
const adminArticlesRoutes = require("./routes/admin/adminArticles.routes");
const postsRoutes = require("./routes/posts.routes");
const { errorHandler } = require("./middlewares/errorHandler");

/** Khởi tạo SQLite + thư mục upload */
require("./models/database").getDb();

if (!fs.existsSync(config.paths.data)) fs.mkdirSync(config.paths.data, { recursive: true });
if (!fs.existsSync(config.paths.uploads)) fs.mkdirSync(config.paths.uploads, { recursive: true });
if (!fs.existsSync(config.paths.uploadsImages)) fs.mkdirSync(config.paths.uploadsImages, { recursive: true });
if (!fs.existsSync(config.paths.uploadsVideos)) fs.mkdirSync(config.paths.uploadsVideos, { recursive: true });

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax"
    }
  })
);

app.use("/uploads", express.static(config.paths.uploads));

app.use("/api/analytics", analyticsRoutes);
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin", adminStatsRoutes);
app.use("/api/admin", adminArticlesRoutes);

app.use("/api", publicArticlesApi);
app.use("/api", healthApi);

/** REST posts (SQLite + multipart) — GET công khai; sửa/xóa cần admin */
app.use("/posts", postsRoutes);

const distPath = config.paths.dist;
const distIndex = path.join(distPath, "index.html");
if (fs.existsSync(distIndex)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads") || req.path.startsWith("/posts")) return next();
    res.sendFile(distIndex);
  });
}

app.use(errorHandler);

const server = app.listen(config.port, () => {
  /** Upload multipart lớn: tắt requestTimeout mặc định (Node có thể ~5 phút). */
  server.requestTimeout = 0;
  console.log(`API + upload  http://localhost:${config.port}`);
  if (fs.existsSync(path.join(distPath, "index.html"))) {
    console.log(`SPA (prod)    http://localhost:${config.port}/`);
  } else {
    console.log(`Chạy React dev: từ thư mục gốc — npm run dev  (Vite + API; đừng chỉ chạy frontend).`);
  }
  console.log(`Admin API      POST /api/admin/auth/login`);
  console.log(`REST posts     GET/POST/PUT/DELETE /posts`);
  console.log(`Health         GET /api/health  (uploadParser phải là busboy)`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Cổng ${config.port} đang được dùng (EADDRINUSE).\n` +
        `  • Chạy cả web + API: từ thư mục gốc dùng  npm run dev  (API lên cổng 3001, Vite proxy tự khớp — không cần giải phóng 3000).\n` +
        `  • Chỉ API: đóng process đang giữ cổng này hoặc  PowerShell: $env:PORT="3001"; npm run server\n` +
        `  • Tìm PID:  netstat -ano | findstr :${config.port}`
    );
    process.exit(1);
  }
  console.error(err);
  process.exit(1);
});
