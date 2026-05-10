const mongoose = require("mongoose");

const adherenceLogSchema = new mongoose.Schema(
  {
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medicine",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["taken", "missed"],
      required: true,
    },
    dosageTime: { type: String }, // e.g., "08:00"
  },
  { timestamps: true }
);

// Index for easy historical lookups
adherenceLogSchema.index({ userId: 1, date: -1 });
adherenceLogSchema.index({ medicineId: 1, date: -1 });

module.exports = mongoose.model("AdherenceLog", adherenceLogSchema);
