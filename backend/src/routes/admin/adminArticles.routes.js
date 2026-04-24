/**
 * adminArticles.routes.js
 * Routes CRUD bài viết dành cho admin (yêu cầu đăng nhập).
 * Tất cả logic xử lý đặt tại article.controller.js.
 */
"use strict";

const express = require("express");
const { requireAdmin } = require("../../middlewares/requireAdmin");
const { refreshSessionAdminRole } = require("../../middlewares/refreshSessionAdminRole");
const { uploadPostFiles } = require("../../middlewares/uploadPostFiles");
const articleController = require("../../controllers/article.controller");

const router = express.Router();

// Áp dụng middleware xác thực admin cho toàn bộ route trong file này
router.use(requireAdmin);
router.use(refreshSessionAdminRole);

router.get("/articles",          articleController.listAdmin);
router.get("/articles/:id",      articleController.getAdmin);
router.post("/articles",         uploadPostFiles, articleController.createFromMultipart);
router.put("/articles/:id",      uploadPostFiles, articleController.updateFromMultipart);
router.delete("/articles/:id",   articleController.remove);

module.exports = router;
