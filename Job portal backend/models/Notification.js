const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        // User notifications (existing)
        "application_status_change",
        "interview_scheduled",
        "job_recommendation",
        "profile_reminder",
        "account_alert",
        "recruiter_message",
        "system_announcement",

        // Recruiter notifications (new)
        "new_application",
        "application_withdrawal",
        "subscription_expiring",
        "job_limit_reached",
        "profile_verification",
        "company_review",
        "team_invitation",
        "candidate_assigned",
        "interview_reminder",
        "interview_cancelled",
        "system_maintenance",
        "policy_update",
        "job_analytics",
        "payment_success",
        "payment_failed",
      ],
    },
    title: {
      type: String,
      required: true,
      maxlength: 100,
    },
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },
    data: {
      // Flexible data storage for different notification types
      jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
      applicationId: { type: mongoose.Schema.Types.ObjectId, ref: "Application" },
      recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: "Recruiter" },
      interviewDate: Date,
      interviewTime: String,
      interviewLink: String,
      metadata: mongoose.Schema.Types.Mixed, // For any additional data
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      index: { expireAfterSeconds: 0 }, // TTL index for auto-deletion
    },
  },
  { timestamps: true }
);

// Compound indexes for common queries
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ user: 1, type: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });

// Virtual for formatted date
notificationSchema.virtual("formattedDate").get(function () {
  const now = new Date();
  const diffMs = now - this.createdAt;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

  return this.createdAt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
});

module.exports = mongoose.model("Notification", notificationSchema);
