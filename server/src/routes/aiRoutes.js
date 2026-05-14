const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { chat } = require("../controllers/aiController");

// POST /api/ai/chat — patient sends a message to SwaasthSaathi
router.post("/chat", protect, chat);

module.exports = router;
