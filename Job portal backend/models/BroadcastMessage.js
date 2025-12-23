const mongoose = require("mongoose");

const BroadcastMessageSchema = new mongoose.Schema(
  {
    // Basic Information
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"]
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      maxlength: [1000, "Message cannot exceed 1000 characters"]
    },
    
    // Message Type & Category
    type: {
      type: String,
      enum: ["announcement", "promotional", "policy_update", "custom"],
      required: true,
      index: true
    },
    category: {
      type: String,
      enum: ["general", "job_alerts", "system", "marketing", "urgent"],
      default: "general"
    },
    
    // Targeting Configuration
    target: {
      // Target all users
      allUsers: {
        type: Boolean,
        default: false
      },
      
      // Target by User Type
      userTypes: [{
        type: String,
        enum: ["JobSeeker", "Recruiter", "HRManager", "CompanyAdmin", "Admin"]
      }],
      
      // Target by Role (User model roles)
      roles: [{
        type: String,
        enum: ["user", "JobSeeker", "CompanyAdmin", "Recruiter", "HRManager", "Admin"]
      }],
      
      // Target specific users by ID
      specificUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        refPath: "target.userModel"
      }],
      
      // Reference model for specificUsers
      userModel: {
        type: String,
        enum: ["User", "Recruiter", "Admin"],
        default: "User"
      },
      
      // Demographic Targeting
      location: [String],
      experienceLevel: [{
        type: String,
        enum: ["Fresher", "Experienced"]
      }],
      profileCompletion: {
        min: { type: Number, min: 0, max: 100 },
        max: { type: Number, min: 0, max: 100 }
      },
      
      // Activity Based
      lastLoginDays: { type: Number }, // Users who haven't logged in for X days
      hasAppliedJobs: { type: Boolean }, // Users who have/haven't applied to jobs
      hasBookmarks: { type: Boolean }, // Users with/without bookmarks
      
      // Exclusion List
      excludeUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        refPath: "target.userModel"
      }]
    },
    
    // Delivery Settings
    delivery: {
      sendInApp: { type: Boolean, default: true },
      sendEmail: { type: Boolean, default: false },
      emailTemplate: { 
        type: String,
        ref: "EmailTemplate" 
      },
      
      // Email Configuration
      emailSubject: String,
      emailContent: String, // HTML content for email
      
      // Priority
      priority: {
        type: String,
        enum: ["low", "medium", "high", "urgent"],
        default: "medium"
      }
    },
    
    // Scheduling
    schedule: {
      sendImmediately: { type: Boolean, default: true },
      scheduledDate: Date,
      scheduledTime: String, // "HH:mm" format
      timezone: { type: String, default: "UTC" },
      repeat: {
        enabled: { type: Boolean, default: false },
        frequency: {
          type: String,
          enum: ["daily", "weekly", "monthly"]
        },
        interval: { type: Number, default: 1 }, // Every X days/weeks/months
        endDate: Date
      }
    },
    
    // Status & Tracking
    status: {
      type: String,
      enum: ["draft", "scheduled", "sending", "sent", "failed", "cancelled"],
      default: "draft",
      index: true
    },
    sentAt: Date,
    completedAt: Date,
    
    // Analytics & Tracking
    analytics: {
      totalTargeted: { type: Number, default: 0 },
      totalSent: { type: Number, default: 0 },
      totalFailed: { type: Number, default: 0 },
      inAppDelivered: { type: Number, default: 0 },
      emailsSent: { type: Number, default: 0 },
      emailsFailed: { type: Number, default: 0 },
      openedCount: { type: Number, default: 0 },
      clickedCount: { type: Number, default: 0 },
      conversionCount: { type: Number, default: 0 }
    },
    
    // Metadata
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin"
    },
    
    // Retry Settings
    retryCount: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 3 },
    lastRetryAt: Date,
    
    // Notes & Comments
    notes: String,
    
    // Campaign ID for grouping related broadcasts
    campaignId: String
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for performance
BroadcastMessageSchema.index({ status: 1, "schedule.scheduledDate": 1 });
BroadcastMessageSchema.index({ createdAt: -1 });
BroadcastMessageSchema.index({ type: 1, category: 1 });
BroadcastMessageSchema.index({ "target.userTypes": 1 });
BroadcastMessageSchema.index({ "target.roles": 1 });

// Virtual for next scheduled time
BroadcastMessageSchema.virtual("nextSchedule").get(function() {
  if (!this.schedule.scheduledDate) return null;
  
  const scheduledTime = new Date(this.schedule.scheduledDate);
  if (this.schedule.scheduledTime) {
    const [hours, minutes] = this.schedule.scheduledTime.split(":").map(Number);
    scheduledTime.setHours(hours, minutes, 0, 0);
  }
  
  return scheduledTime;
});

// Virtual for progress percentage
BroadcastMessageSchema.virtual("progress").get(function() {
  if (this.status === "sent" || this.status === "completed") return 100;
  if (this.analytics.totalTargeted === 0) return 0;
  return Math.round((this.analytics.totalSent / this.analytics.totalTargeted) * 100);
});

// Pre-save middleware to update analytics
BroadcastMessageSchema.pre("save", function(next) {
  // Update total targeted count if not set
  if (!this.analytics.totalTargeted && this.status === "sending") {
    // This will be calculated when sending starts
    this.analytics.totalTargeted = 0;
  }
  
  next();
});

module.exports = mongoose.model("BroadcastMessage", BroadcastMessageSchema);