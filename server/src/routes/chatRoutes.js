const express = require("express");
const chatController = require("../controllers/chatController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Get unread counts (must be before /:userId)
router.get("/unread", authMiddleware, chatController.getUnreadCounts);

// Get chat history with another user
router.get("/:userId", authMiddleware, chatController.getChatHistory);

module.exports = router;
