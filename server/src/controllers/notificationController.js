const Notification = require("../models/Notification");

exports.listNotifications = async (req, res, next) => {
  try {
    const limit = Math.min(
      Math.max(parseInt(String(req.query.limit || "50"), 10) || 50, 1),
      200
    );
    const items = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("medicineId", "name")
      .lean();

    const unreadCount = await Notification.countDocuments({ userId: req.user.id, read: false });

    res.json({ items, unreadCount });
  } catch (err) {
    next(err);
  }
};

exports.markRead = async (req, res, next) => {
  try {
    const doc = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { read: true },
      { new: true }
    ).populate("medicineId", "name");

    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) {
    next(err);
  }
};

exports.markAllRead = async (_req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user.id, read: false },
      { read: true }
    );
    res.json({ modified: result.modifiedCount });
  } catch (err) {
    next(err);
  }
};
