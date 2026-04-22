const express = require("express");

const { requireAuth } = require("../middleware/requireAuth");
const { summary } = require("../controllers/analytics.controller");

const router = express.Router();
router.use(requireAuth);

router.get("/summary", summary);

module.exports = router;

