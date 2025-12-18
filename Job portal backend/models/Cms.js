
const mongoose = require("mongoose");

const CmsSchema = new mongoose.Schema(
  {
    singleton: {
      type: String,
      default: "cms-content",
      unique: true,
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cms", CmsSchema);
