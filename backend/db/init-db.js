/**
 * Script khởi tạo database.sqlite và bảng posts (chạy: npm run db:init).
 * Server cũng tự tạo bảng khi khởi động; script này hữu ích để chuẩn bị file trước.
 */
const { openDatabase } = require("../models/database");

openDatabase();
console.log("OK: database.sqlite đã sẵn sàng (bảng posts).");
