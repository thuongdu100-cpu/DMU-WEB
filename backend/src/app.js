/**
 * Express application factory (server.js and integration tests).
 * Call connectDatabase() before listen or before requests use the DB.
 */
const express = require("express");
const path = require("path");
const session = require("express-session");
const fs = require("fs");
const config = require("../config");
// Routes — Public API (người xem)
const publicArticlesApi = require("./routes/api/publicArticles.routes");
const healthApi = require("./routes/api/health.routes");
const dbPingApi = require("./routes/api/dbPing.routes");
// Routes — Admin API (yêu cầu đăng nhập)
const analyticsRoutes = require("./routes/analytics.routes");
const adminAuthRoutes = require("./routes/admin/adminAuth.routes");
const adminStatsRoutes = require("./routes/admin/adminStats.routes");
const adminArticlesRoutes = require("./routes/admin/adminArticles.routes");
const { errorHandler } = require("./middlewares/errorHandler");

function ensureUploadDirs() {
  if (!fs.existsSync(config.paths.data)) fs.mkdirSync(config.paths.data, { recursive: true });
  if (!fs.existsSync(config.paths.uploads)) fs.mkdirSync(config.paths.uploads, { recursive: true });
  if (!fs.existsSync(config.paths.uploadsImages)) fs.mkdirSync(config.paths.uploadsImages, { recursive: true });
  if (!fs.existsSync(config.paths.uploadsVideos)) fs.mkdirSync(config.paths.uploadsVideos, { recursive: true });
}

function buildApp() {
  ensureUploadDirs();

  const app = express();

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  app.set("trust proxy", 1);

  app.use(
    session({
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: false,      // true khi deploy HTTPS
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000  // 7 ngày
      }
    })
  );

  app.use("/uploads", express.static(config.paths.uploads));

  // Admin
  app.use("/api/analytics", analyticsRoutes);
  app.use("/api/admin/auth", adminAuthRoutes);
  app.use("/api/admin", adminStatsRoutes);
  app.use("/api/admin", adminArticlesRoutes);
  // Public
  app.use("/api", publicArticlesApi);
  app.use("/api", healthApi);
  app.use("/api", dbPingApi);

  const distPath = config.paths.dist;
  const distIndex = path.join(distPath, "index.html");
  if (fs.existsSync(distIndex)) {
    app.use(express.static(distPath));
    app.use((req, res, next) => {
      if (req.method !== "GET" && req.method !== "HEAD") return next();
      if (req.path.startsWith("/api") || req.path.startsWith("/uploads") || req.path.startsWith("/posts")) {
        return next();
      }
      res.sendFile(distIndex);
    });
  }

  app.use(errorHandler);

  return app;
}

module.exports = { buildApp, ensureUploadDirs };
