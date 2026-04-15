const path = require("path");

const root = path.join(__dirname, "..");

module.exports = {
  port: process.env.PORT || 3000,
  adminUsername: (process.env.ADMIN_USERNAME || "admin").trim().toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD || "admin123",
  sessionSecret: process.env.SESSION_SECRET || "dmu-admin-session-change-me",
  paths: {
    root,
    /** Build React (production) */
    dist: path.join(root, "frontend", "dist"),
    /** Thư mục gốc upload — static: /uploads/... */
    uploads: path.join(root, "uploads"),
    uploadsImages: path.join(root, "uploads", "images"),
    uploadsVideos: path.join(root, "uploads", "videos"),
    /** SQLite (file tại root project theo yêu cầu) */
    database: path.join(root, "database.sqlite"),
    data: path.join(__dirname, "data")
  }
};
