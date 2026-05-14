const express = require("express");
const chatController = require("../controllers/chatController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Get chat history with another user
router.get("/:userId", authMiddleware, chatController.getChatHistory);

module.exports = router;
