const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // References the User model (role: Recruiter)
      required: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "expired", "cancelled", "pending"],
      default: "pending",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    autoRenew: {
      type: Boolean,
      default: false,
    },
    // Payment details
    payment: {
      amount: { type: Number, required: true },
      currency: { type: String, default: "INR" },
      paymentMethod: { type: String },
      transactionId: { type: String },
      paymentStatus: {
        type: String,
        enum: ["pending", "completed", "failed", "refunded"],
        default: "pending",
      },
      paidAt: { type: Date },
    },
    // Usage tracking
    usage: {
      jobsPosted: { type: Number, default: 0 },
      activeJobs: { type: Number, default: 0 },
      totalApplications: { type: Number, default: 0 },
      teamMembersAdded: { type: Number, default: 0 },
      managersAdded: { type: Number, default: 0 },
    },
    // Cancellation details
    cancellation: {
      cancelledAt: { type: Date },
      cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      reason: { type: String },
    },
    invoiceNumber: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

// Indexes
subscriptionSchema.index({ recruiterId: 1, status: 1 });
subscriptionSchema.index({ endDate: 1, status: 1 });

// Virtual to check if subscription is active
subscriptionSchema.virtual("isActive").get(function () {
  return this.status === "active" && this.endDate > new Date();
});

// Virtual to get days remaining
subscriptionSchema.virtual("daysRemaining").get(function () {
  if (this.status !== "active") return 0;
  const now = new Date();
  const diff = this.endDate - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

// Method to check if subscription has expired
subscriptionSchema.methods.checkExpiry = async function () {
  if (this.status === "active" && this.endDate < new Date()) {
    this.status = "expired";
    await this.save();
    return true;
  }
  return false;
};

// Static method to get active subscription for recruiter
subscriptionSchema.statics.getActiveSubscription = async function (recruiterId) {
  const subscription = await this.findOne({
    recruiterId,
    status: "active",
    endDate: { $gt: new Date() },
  }).populate("plan");

  if (subscription) {
    await subscription.checkExpiry();
    if (subscription.status === "active") {
      return subscription;
    }
  }
  return null;
};

// Static method to check if recruiter can perform action
subscriptionSchema.statics.canPerformAction = async function (recruiterId, actionType) {
  const subscription = await this.getActiveSubscription(recruiterId);

  if (!subscription) {
    // Allow basic actions if no sub, but usually strict restrictions apply
    // For this logic, we return false if no sub
    return { allowed: false, reason: "No active subscription" };
  }

  const plan = subscription.plan;

  switch (actionType) {
    case "post_job":
      if (
        plan.features.maxActiveJobs !== null &&
        subscription.usage.activeJobs >= plan.features.maxActiveJobs
      ) {
        return {
          allowed: false,
          reason: `Maximum active jobs limit (${plan.features.maxActiveJobs}) reached`,
          limit: plan.features.maxActiveJobs,
          current: subscription.usage.activeJobs,
        };
      }
      break;

    // Add other cases (analytics, team members) as needed
  }

  return { allowed: true };
};

// Method to update usage
subscriptionSchema.methods.updateUsage = async function (usageType, increment = 1) {
  switch (usageType) {
    case "job_posted":
      this.usage.jobsPosted += increment;
      this.usage.activeJobs += increment;
      break;
    case "job_closed":
      this.usage.activeJobs = Math.max(0, this.usage.activeJobs - increment);
      break;
    case "application_received":
      this.usage.totalApplications += increment;
      break;
  }
  await this.save();
};

module.exports = mongoose.model("Subscription", subscriptionSchema);