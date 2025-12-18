
const mongoose = require("mongoose");

const JobAlertSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    keywords: {
      type: String,
      required: true,
    },
    location: {
      type: String,
    },
    jobTypes: {
      type: [String],
    },
    frequency: {
      type: String,
      enum: ["daily", "weekly"],
      default: "daily",
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true, // ensure virtuals are included if any are added
      transform: function (doc, ret) {
        ret.id = ret._id.toString(); // Map _id to id
        delete ret._id;
        delete ret.__v;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

JobAlertSchema.index({ user: 1 });

module.exports = mongoose.model("JobAlert", JobAlertSchema);