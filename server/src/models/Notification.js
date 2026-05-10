const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medicine",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["dosage", "expiry"],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false, index: true },
    meta: {
      dosageTime: { type: String },
      expiryDate: { type: Date },
    },
  },
  { timestamps: true }
);

notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
