/**
 * publicArticles.routes.js
 * Routes công khai — người xem truy cập bài viết đã published.
 * Không yêu cầu đăng nhập.
 */
"use strict";

const express = require("express");
const articleController = require("../../controllers/article.controller");

const router = express.Router();

router.get("/public/articles",      articleController.listPublic);
router.get("/public/articles/:id",  articleController.getPublic);

module.exports = router;
