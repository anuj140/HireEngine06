
const mongoose = require("mongoose");

const broadcastSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    audience: { type: String, required: true },
    channels: [{ type: String, enum: ["email", "notification"] }],
    status: {
      type: String,
      enum: ["Sent", "Scheduled", "Draft"],
      default: "Draft",
    },
    sentDate: { type: Date },
    openRate: { type: String },
    clickRate: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Broadcast", broadcastSchema);
