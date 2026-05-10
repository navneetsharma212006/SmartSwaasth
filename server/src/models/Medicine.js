const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    times: [{ type: String }],
    dosage: { type: String, default: "" },
  },
  { _id: false }
);

const medicineSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    expiryDate: { type: Date, required: true },
    imageUrl: { type: String },
    rawText: { type: String },
    dosageInstructions: { type: String },
    schedule: scheduleSchema,
    tabletsInPacket: { type: Number, min: 0 },
    syrupAmountMl: { type: Number, min: 0 },
    entryMethod: {
      type: String,
      enum: ["scan", "manual"],
      default: "scan",
    },
    complianceScore: { type: Number, default: 100 }, // 0-100
    complianceRisk: { 
      type: String, 
      enum: ["low", "moderate", "high"], 
      default: "low" 
    },
    dosagePerDay: { type: Number, min: 1, max: 3 },
    dosageTimes: [{ type: String }],
    /** When true, node-cron fires daily dose reminders at each dosage time */
    dailyDosageReminderEnabled: { type: Boolean, default: false },
    /** When true, node-schedule fires a one-time notification on the expiry date */
    expiryReminderEnabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const { encrypt, decrypt } = require("../utils/encryption");

medicineSchema.pre("save", function (next) {
  if (this.isModified("dosageInstructions") && this.dosageInstructions) {
    this.dosageInstructions = encrypt(this.dosageInstructions);
  }
  next();
});

medicineSchema.post("init", function (doc) {
  if (doc.dosageInstructions) {
    doc.dosageInstructions = decrypt(doc.dosageInstructions);
  }
});

module.exports = mongoose.model("Medicine", medicineSchema);
