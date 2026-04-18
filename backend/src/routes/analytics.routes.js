const express = require("express");
const visits = require("../services/visits.service");
const { translateErrorString } = require("../utils/vietnameseErrors");

const router = express.Router();

router.post("/visit", express.json(), (req, res) => {
  try {
    visits.recordVisit({
      path: (req.body && req.body.path) || req.path,
      ref: (req.body && req.body.ref) || (req.get("referer") || "")
    });
    res.json({ ok: true });
  } catch (e) {
    const message =
      translateErrorString(e && e.message ? String(e.message) : "") ||
      "Kh\u00F4ng ghi \u0111\u01B0\u1EE3c l\u01B0\u1EE3t truy c\u1EADp.";
    res.status(500).json({ ok: false, message });
  }
});

module.exports = router;
