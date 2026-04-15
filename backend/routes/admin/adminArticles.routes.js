const express = require("express");
const { requireAdmin } = require("../../middlewares/requireAdmin");
const { uploadPostFiles } = require("../../middlewares/uploadPostFiles");
const postsController = require("../../controllers/posts.controller");
const postModel = require("../../models/post.model");

const router = express.Router();
router.use(requireAdmin);

router.get("/articles", (req, res) => {
  res.json({ ok: true, articles: postModel.listPostsAdmin() });
});

router.get("/articles/:id", (req, res) => {
  const art = postModel.getById(req.params.id);
  if (!art) return res.status(404).json({ ok: false, message: "Không tìm thấy bài." });
  res.json({ ok: true, article: art });
});

router.post("/articles", uploadPostFiles, postsController.createFromMultipart);

router.put("/articles/:id", uploadPostFiles, postsController.updateFromMultipart);

router.delete("/articles/:id", (req, res) => {
  const ok = postModel.deletePost(req.params.id);
  if (!ok) return res.status(404).json({ ok: false, message: "Không tìm thấy bài." });
  res.json({ ok: true });
});

module.exports = router;
