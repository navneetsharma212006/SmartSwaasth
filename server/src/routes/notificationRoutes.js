const express = require("express");
const c = require("../controllers/notificationController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/notifications", c.listNotifications);
router.patch("/notifications/:id/read", c.markRead);
router.post("/notifications/read-all", c.markAllRead);

module.exports = router;
