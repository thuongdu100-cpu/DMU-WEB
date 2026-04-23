const express = require("express");
const { requireAdmin } = require("../../middlewares/requireAdmin");
const { refreshSessionAdminRole } = require("../../middlewares/refreshSessionAdminRole");
const visits = require("../../services/visits.service");
const articleModel = require("../../models/article.model");

const router = express.Router();
router.use(requireAdmin);
router.use(refreshSessionAdminRole);

const DEFAULT_WEEKS = 4;
const MAX_WEEKS = 52;
const DAYS_WINDOW = 7;

router.get("/dashboard", async (req, res, next) => {
  try {
    const weeks = Math.min(
      Math.max(parseInt(req.query.weeks, 10) || DEFAULT_WEEKS, 1),
      MAX_WEEKS
    );
    const block = Math.max(0, parseInt(req.query.block, 10) || 0);
    const useDaily = weeks === 1;
    const visitsByWeek = useDaily
      ? visits.dailyVisitCounts(DAYS_WINDOW, block)
      : visits.weeklyVisitCounts(weeks, block);
    const articlesPublishedByWeek = useDaily
      ? await articleModel.dailyArticleCounts(DAYS_WINDOW, block)
      : await articleModel.weeklyArticleCounts(weeks, block);
    res.json({
      ok: true,
      weeks,
      block,
      periodType: useDaily ? "day" : "week",
      visitsByWeek,
      articlesPublishedByWeek,
      daysWindow: useDaily ? DAYS_WINDOW : undefined
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
