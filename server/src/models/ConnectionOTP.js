const mongoose = require("mongoose");

const connectionOTPSchema = new mongoose.Schema(
  {
    caregiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    otp: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 600, // OTP expires in 10 minutes
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ConnectionOTP", connectionOTPSchema);
