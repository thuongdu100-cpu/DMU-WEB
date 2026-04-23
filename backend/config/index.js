const path = require("path");
const fs = require("fs");

let dotenv;
try {
  dotenv = require("dotenv");
} catch {
  dotenv = null;
}

const root = path.join(__dirname, "..", "..");

if (dotenv) {
  const rootEnv = path.join(root, ".env");
  if (fs.existsSync(rootEnv)) dotenv.config({ path: rootEnv });
  const dbEnv = path.join(__dirname, "db.env");
  if (fs.existsSync(dbEnv)) dotenv.config({ path: dbEnv, override: true });
}

module.exports = {
  port: Number(process.env.PORT) || 3001,
  adminUsername: (process.env.ADMIN_USERNAME || "admin").trim().toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD || "admin123",
  sessionSecret: process.env.SESSION_SECRET || "dmu-admin-session-change-me",
  /** Bearer token (Authorization: Bearer …) để AI/script gọi POST/PUT/DELETE bài viết như admin bot */
  aiPublishBearerToken: String(process.env.AI_PUBLISH_BEARER_TOKEN || "").trim(),
  /** id hàng `admins` role=bot (mặc định user `ai-bot` từ seed). Có thể ghi đè bằng env. */
  aiPublishAdminId: (() => {
    const raw = String(process.env.AI_PUBLISH_ADMIN_ID || "").trim();
    if (!raw) return null;
    const n = Number.parseInt(raw, 10);
    return Number.isInteger(n) && n > 0 ? n : null;
  })(),
  database: {
    url: (process.env.DATABASE_URL || "").trim()
  },
  paths: {
    root,
    dist: path.join(root, "frontend", "dist"),
    uploads: path.join(root, "uploads"),
    uploadsImages: path.join(root, "uploads", "images"),
    uploadsVideos: path.join(root, "uploads", "videos"),
    data: path.join(__dirname, "..", "data")
  }
};
