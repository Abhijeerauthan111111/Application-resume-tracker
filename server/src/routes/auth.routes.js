const express = require("express");

const { requireAuth } = require("../middleware/requireAuth");
const { me } = require("../controllers/auth.controller");

const router = express.Router();

router.get("/me", requireAuth, me);

module.exports = router;

