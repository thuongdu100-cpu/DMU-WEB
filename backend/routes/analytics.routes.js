const express = require("express");
const visits = require("../services/visits.service");

const router = express.Router();

router.post("/visit", (req, res) => {
  const pagePath = (req.body && req.body.path) || req.headers.referer || "/";
  visits.recordVisit(pagePath);
  res.status(204).end();
});

module.exports = router;
