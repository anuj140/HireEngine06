const mongoose = require("mongoose");

const phoneVerificationSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, unique: true },
    verified: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// Automatically remove expired docs
phoneVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("PhoneVerification", phoneVerificationSchema);