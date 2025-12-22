const mongoose = require("mongoose");

const BannerSchema = new mongoose.Schema({
  // Core Content
  title: { 
    type: String, 
    required: [true, "Title is required"],
    trim: true,
    maxlength: [100, "Title cannot exceed 100 characters"]
  },
  subtitle: { 
    type: String, 
    trim: true,
    maxlength: [200, "Subtitle cannot exceed 200 characters"]
  },
  
  // Visuals
  imageUrl: { 
    type: String, 
    required: [true, "Image URL is required"]
  },
  mobileImageUrl: { type: String }, // Optional separate mobile image
  backgroundColor: { 
    type: String, 
    default: "#ffffff",
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format"]
  },
  textColor: { 
    type: String, 
    default: "#000000",
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format"]
  },
  
  // CTA Buttons (max 2)
  ctaButtons: [{
    text: { 
      type: String, 
      required: true,
      maxlength: [30, "CTA text cannot exceed 30 characters"]
    },
    url: { 
      type: String, 
      required: true,
      maxlength: [500, "URL cannot exceed 500 characters"]
    },
    type: {
      type: String,
      enum: ["primary", "secondary", "outline", "text"],
      default: "primary"
    },
    order: { type: Number, default: 0 }
  }],
  
  // Placement & Display
  placement: {
    type: String,
    enum: [
      "homepage-hero",
      "homepage-below-hero", 
      "job-seeker-dashboard",
      "recruiter-dashboard",
      "login-page",
      "registration-page",
      "global-top",
      "global-bottom"
    ],
    required: [true, "Placement is required"],
    index: true
  },
  
  // Targeting
  targetAudience: {
    roles: [{
      type: String,
      enum: ["JobSeeker", "Recruiter", "HRManager", "Admin", "CompanyAdmin", "user", "all"]
    }],
    showToGuest: { type: Boolean, default: true }
  },
  
  // Scheduling
  isActive: { type: Boolean, default: true },
  schedule: {
    startDate: { type: Date },
    endDate: { type: Date },
    daysOfWeek: [{
      type: Number,
      min: 0,
      max: 6
    }],
    startTime: { type: String }, // "HH:mm" format
    endTime: { type: String }    // "HH:mm" format
  },
  
  // Order & Priority
  order: { type: Number, default: 0, index: true },
  priority: { type: Number, default: 0, min: 0, max: 100 },
  
  // Status
  status: {
    type: String,
    enum: ["draft", "active", "paused", "archived"],
    default: "draft"
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
  
  // Analytics (optional tracking)
  impressions: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
BannerSchema.index({ placement: 1, isActive: 1, status: 1 });
BannerSchema.index({ "schedule.startDate": 1, "schedule.endDate": 1 });
BannerSchema.index({ "targetAudience.roles": 1 });
BannerSchema.index({ order: 1, priority: -1 });

// Virtual for checking if banner should be displayed based on schedule
BannerSchema.virtual("isCurrentlyActive").get(function() {
  if (!this.isActive || this.status !== "active") return false;
  
  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = now.getHours() * 60 + now.getMinutes(); // Convert to minutes
  
  // Check date range
  if (this.schedule.startDate && this.schedule.startDate > now) return false;
  if (this.schedule.endDate && this.schedule.endDate < now) return false;
  
  // Check days of week
  if (this.schedule.daysOfWeek && this.schedule.daysOfWeek.length > 0) {
    if (!this.schedule.daysOfWeek.includes(currentDay)) return false;
  }
  
  // Check time slots
  if (this.schedule.startTime && this.schedule.endTime) {
    const [startHour, startMinute] = this.schedule.startTime.split(":").map(Number);
    const [endHour, endMinute] = this.schedule.endTime.split(":").map(Number);
    
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    
    if (currentTime < startMinutes || currentTime > endMinutes) return false;
  }
  
  return true;
});

module.exports = mongoose.model("Banner", BannerSchema);