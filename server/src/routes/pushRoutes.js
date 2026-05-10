const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const PushSubscription = require("../models/PushSubscription");

/**
 * POST /api/push/subscribe
 * Save a push subscription for the authenticated user
 */
router.post("/subscribe", auth, async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ error: "Invalid subscription object" });
    }

    // Upsert: update if endpoint exists for this user, else create
    await PushSubscription.findOneAndUpdate(
      { userId: req.user.id, endpoint: subscription.endpoint },
      {
        userId: req.user.id,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        active: true,
      },
      { upsert: true, new: true }
    );

    res.json({ message: "Push subscription saved" });
  } catch (err) {
    console.error("Push subscribe error:", err);
    res.status(500).json({ error: "Failed to save subscription" });
  }
});

/**
 * POST /api/push/unsubscribe
 * Remove a push subscription
 */
router.post("/unsubscribe", auth, async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      return res.status(400).json({ error: "Endpoint required" });
    }

    await PushSubscription.findOneAndUpdate(
      { userId: req.user.id, endpoint },
      { active: false }
    );

    res.json({ message: "Push subscription removed" });
  } catch (err) {
    console.error("Push unsubscribe error:", err);
    res.status(500).json({ error: "Failed to remove subscription" });
  }
});

/**
 * GET /api/push/status
 * Check if the user has an active push subscription
 */
router.get("/status", auth, async (req, res) => {
  try {
    const count = await PushSubscription.countDocuments({
      userId: req.user.id,
      active: true,
    });
    res.json({ subscribed: count > 0 });
  } catch (err) {
    res.status(500).json({ error: "Failed to check status" });
  }
});

module.exports = router;
