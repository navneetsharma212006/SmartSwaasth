const mongoose = require("mongoose");

const pushSubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    endpoint: { type: String, required: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    // Track if the subscription is still valid
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate subscriptions
pushSubscriptionSchema.index({ userId: 1, endpoint: 1 }, { unique: true });

module.exports = mongoose.model("PushSubscription", pushSubscriptionSchema);
