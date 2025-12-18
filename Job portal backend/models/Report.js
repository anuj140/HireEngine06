const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  reportedBy: { type: mongoose.Schema.Types.ObjectId, refPath: 'userType' },
  userType: { type: String, enum: ['User', 'Recruiter'] },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  message: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Report", reportSchema);