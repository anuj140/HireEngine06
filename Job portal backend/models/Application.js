const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
  applicant: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: {
    type: String,
    enum: [
      "New", // default
      "Reviewed",
      "Shortlisted",
      "Interview Scheduled",
      "Hired",
      "Rejected",
    ],
    default: "New",
  },
  answers: [
    {
      question: { type: String, required: true },
      type: { type: String, enum: ["text", "boolean"], default: "text" },
      answer: { type: mongoose.Schema.Types.Mixed, required: true }, // string or boolean
    },
  ],

  appliedAt: { type: Date, default: Date.now },
  notes: [
    {
      text: { type: String, required: true },
      date: { type: Date, default: Date.now },
      author: { type: String, default: "Recruiter" }
    }
  ]
});

applicationSchema.index({ job: 1 });
applicationSchema.index({ applicant: 1 });
applicationSchema.index({ status: 1 });

module.exports = mongoose.model("Application", applicationSchema);
