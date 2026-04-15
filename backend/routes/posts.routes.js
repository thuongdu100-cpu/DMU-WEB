/**
 * REST API theo spec: /posts
 * GET mở công khai; POST/PUT/DELETE cần đăng nhập admin (session).
 */
const express = require("express");
const { requireAdmin } = require("../middlewares/requireAdmin");
const { uploadPostFiles } = require("../middlewares/uploadPostFiles");
const postsController = require("../controllers/posts.controller");

const router = express.Router();

router.get("/", postsController.listAll);
router.get("/:id", postsController.getOne);

router.post("/", requireAdmin, uploadPostFiles, postsController.createFromMultipart);
router.put("/:id", requireAdmin, uploadPostFiles, postsController.updateFromMultipart);
router.delete("/:id", requireAdmin, postsController.remove);

module.exports = router;
