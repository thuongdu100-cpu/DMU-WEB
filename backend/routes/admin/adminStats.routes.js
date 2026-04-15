const express = require("express");
const { requireAdmin } = require("../../middlewares/requireAdmin");
const visits = require("../../services/visits.service");
const postModel = require("../../models/post.model");

const router = express.Router();
router.use(requireAdmin);

const DEFAULT_WEEKS = 4;
const MAX_WEEKS = 52;

router.get("/dashboard", (req, res) => {
  const weeks = Math.min(
    Math.max(parseInt(req.query.weeks, 10) || DEFAULT_WEEKS, 1),
    MAX_WEEKS
  );
  const block = Math.max(0, parseInt(req.query.block, 10) || 0);
  res.json({
    ok: true,
    weeks,
    block,
    visitsByWeek: visits.weeklyVisitCounts(weeks, block),
    articlesPublishedByWeek: postModel.weeklyArticleCounts(weeks, block)
  });
});

module.exports = router;
