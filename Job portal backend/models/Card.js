const mongoose = require("mongoose");

const CardSchema = new mongoose.Schema(
  {
    // Core Content
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"]
    },
    content: {
      type: String,
      required: [true, "Content is required"],
      trim: true,
      maxlength: [1000, "Content cannot exceed 1000 characters"]
    },
    contentType: {
      type: String,
      enum: ["plain", "html"],
      default: "plain"
    },
    
    // Visual Assets
    imageUrl: {
      type: String,
      default: null
    },
    backgroundType: {
      type: String,
      enum: ["solid", "gradient", "image", "image-gradient"],
      default: "solid"
    },
    backgroundColor: {
      type: String,
      default: "#ffffff",
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$|^linear-gradient|^radial-gradient/, "Invalid color or gradient format"]
    },
    textColor: {
      type: String,
      default: "#000000",
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format"]
    },
    
    // CTA Configuration
    cta: {
      text: {
        type: String,
        required: [true, "CTA text is required"],
        maxlength: [50, "CTA text cannot exceed 50 characters"]
      },
      link: {
        type: String,
        required: [true, "CTA link is required"],
        maxlength: [500, "CTA link cannot exceed 500 characters"]
      },
      type: {
        type: String,
        enum: ["primary", "secondary", "outline"],
        default: "primary"
      }
    },
    
    // Badge/Status (for Template C)
    badge: {
      text: {
        type: String,
        maxlength: [20, "Badge text cannot exceed 20 characters"]
      },
      color: {
        type: String,
        default: "#10b981",
        match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format"]
      }
    },
    
    // Template Configuration
    template: {
      type: String,
      enum: ["A", "B", "C"],
      required: [true, "Template type is required"],
      default: "A"
    },
    
    // Placement & Targeting
    placement: {
      type: String,
      enum: [
        "global", 
        "homepage", 
        "dashboard", 
        "search-results", 
        "pre-login", 
        "post-login", 
        "sidebar", 
        "footer",
        "profile-page",
        "jobs-page"
      ],
      default: "global",
      required: [true, "Placement is required"]
    },
    
    // User Targeting (based on your User model)
    targetAudience: {
      // Match User.role enum
      roles: [{
        type: String,
        enum: ["JobSeeker", "Recruiter", "HRManager", "Admin", "CompanyAdmin", "user"]
      }],
      
      // Active status targeting
      userStatus: {
        type: String,
        enum: ["active", "inactive", "any"],
        default: "any"
      },
      
      // Profile completion targeting (from User.profile.profileCompletion)
      minProfileCompletion: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      
      // Location targeting (from User.profile.location)
      locations: [String],
      
      // Experience targeting (from User.profile.workStatus)
      workStatus: [{
        type: String,
        enum: ["Fresher", "Experienced"]
      }],
      
      // Hide for specific users
      hideForUsers: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User" 
      }]
    },
    
    // Scheduling & Priority
    priority: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    schedule: {
      startDate: Date,
      endDate: Date,
      daysOfWeek: [{
        type: Number,
        min: 0,
        max: 6
      }],
      timeSlots: [{
        start: String, // Format: "HH:mm" (09:00)
        end: String    // Format: "HH:mm" (17:00)
      }]
    },
    
    // Analytics
    impressions: {
      type: Number,
      default: 0
    },
    clicks: {
      type: Number,
      default: 0
    },
    conversionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    
    // Status & Metadata
    status: {
      type: String,
      enum: ["draft", "active", "paused", "archived"],
      default: "draft"
    },
    order: {
      type: Number,
      default: 0
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin"
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for performance
CardSchema.index({ placement: 1, status: 1, priority: -1 });
CardSchema.index({ template: 1 });
CardSchema.index({ "targetAudience.roles": 1 });
CardSchema.index({ "schedule.startDate": 1, "schedule.endDate": 1 });
CardSchema.index({ order: 1 });

// Virtual for conversion rate calculation
CardSchema.virtual("calculatedConversionRate").get(function() {
  if (this.impressions === 0) return 0;
  return ((this.clicks / this.impressions) * 100).toFixed(2);
});

module.exports = mongoose.model("Card", CardSchema);