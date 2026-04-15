const express = require("express");
const postModel = require("../../models/post.model");

const router = express.Router();

router.get("/public/articles", (req, res) => {
  res.json({ ok: true, articles: postModel.listPublicSummaries() });
});

router.get("/public/articles/:id", (req, res) => {
  const article = postModel.getPublishedById(req.params.id);
  if (!article) {
    return res.status(404).json({ ok: false, message: "Không tìm thấy bài." });
  }
  res.json({ ok: true, article });
});

module.exports = router;
