const express = require("express");
const router = express.Router();
const { getIntroVideo } = require("../../controllers/media.controller");

// GET /api/media/intro
router.get("/intro", getIntroVideo);

module.exports = router;