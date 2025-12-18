// models/Recruiter.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const recruiterSchema = new mongoose.Schema(
  {
    // 👤 Recruiter identity
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Please provide a valid email",
      ],
    },
    password: { type: String, required: true },
    role: { type: String, default: "recruiter" },
    phone: { type: String, required: true, unique: true },
    phoneVerified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    jobsPosted: [{ type: mongoose.Schema.Types.ObjectId, ref: "Job" }],

    teamMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: "TeamMember" }],

    // 🏢 Company identifiers (immutable)
    companyName: { type: String, required: true },
    companyType: {
      type: String,
      enum: ["pvt_ltd", "llp", "partnership", "startup", "proprietorship"],
      required: true,
    },
    companyWebsite: { type: String },
    CIN: { type: String },
    LLPIN: { type: String },
    GSTIN: { type: String },
    ownerPAN: { type: String },
    udyamRegNo: { type: String },

    // 📄 Verification documents
    documents: [{ type: String }],
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    verificationNotes: { type: String },

    // 🧩 Company Profile (editable)
    // NEW: Frontend-compatible fields
    bannerUrl: { type: String },
    logoUrl: { type: String },
    tagline: { type: String },
    description: { type: String },
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
    followers: { type: Number, default: 0 },
    industry: { type: String },

    // Flattened company details for frontend compatibility
    companySize: { type: String },
    foundedYear: { type: Number },
    headquarters: { type: String },
    website: { type: String },

    // Overview object matching frontend structure
    overview: {
      about: {
        text: { type: String },
        videoUrl: { type: String }
      },
      diversityInclusion: {
        title: { type: String },
        text: { type: String },
        imageUrl: { type: String }
      },
      communityEngagement: {
        title: { type: String },
        text: { type: String },
        images: [{ type: String }]
      },
      leaders: [{
        name: { type: String },
        title: { type: String },
        imageUrl: { type: String }
      }],
      corporateSocialResponsibility: {
        imageUrl: { type: String },
        title: { type: String }
      },
      lifeWithUs: {
        images: [{ type: String }]
      },
      departmentsHiring: [{ type: String }]
    },

    // WhyJoinUs object matching frontend structure
    whyJoinUs: {
      keyHighlights: [{
        icon: { type: String },
        title: { type: String },
        subtitle: { type: String }
      }],
      employeeSpeaks: [{
        category: { type: String },
        rating: { type: Number }
      }],
      ratingsInOtherAreas: [{
        category: { type: String },
        rating: { type: Number }
      }],
      awards: [{
        year: { type: Number },
        title: { type: String }
      }],
      socialLinks: {
        youtube: { type: String },
        x: { type: String },
        facebook: { type: String },
        instagram: { type: String },
        linkedin: { type: String }
      },
      leaderMessage: {
        videoUrl: { type: String },
        text: { type: String }
      },
      engageWithUs: {
        imageUrl: { type: String },
        title: { type: String }
      },
      lifeAt: {
        images: [{ type: String }]
      },
      benefits: [{ type: String }],
      employeeSalaries: [{ type: mongoose.Schema.Types.Mixed }],
      reviewsByProfile: [{ type: mongoose.Schema.Types.Mixed }]
    },

    // OLD FIELDS - Kept for backward compatibility (DEPRECATED)
    bannerImage: { type: String },
    tags: [{ type: String }], // e.g. ['IT Services', 'Consulting']
    aboutUs: {
      description: { type: String },
      videoUrl: { type: String },
    },

    // Section (only 1 allowed)
    section: {
      title: { type: String },
      image: { type: String },
      description: { type: String },
    },

    // Gallery section (only 1 allowed, but up to 10 images)
    gallerySection: {
      title: { type: String },
      images: [{ type: String, maxlength: 10 }],
      description: { type: String },
    },

    // Leaders (max 10) - OLD FORMAT
    leaders: [
      {
        image: { type: String },
        name: { type: String },
        role: { type: String },
      },
    ],

    // Key highlights (max 10) - OLD FORMAT
    keyHighlights: [
      {
        icon: { type: String },
        title: { type: String },
        subtitle: { type: String },
      },
    ],

    // Awards (max 10) - OLD FORMAT
    awards: [
      {
        year: { type: Number },
        title: { type: String },
      },
    ],

    // Company details (editable) - OLD FORMAT
    companyDetails: {
      type: { type: String },
      size: { type: String },
      foundedYear: { type: Number },
      headquarters: { type: String },
      website: { type: String },
    },

    // Social media (at least 2 required) - OLD FORMAT
    socialMedia: {
      youtube: { type: String },
      twitter: { type: String },
      facebook: { type: String },
      instagram: { type: String },
      linkedin: { type: String },
    },

    // inside recruiterSchema (models/Recruiter.js)
    subscription: {
      plan: {
        type: String,
        enum: ["free", "standard", "pro", "pro_max"],
        default: "free",
      },
      jobPostLimit: { type: Number, default: 3 }, // fallback - used rarely; main rules come from config/jobPlans
      jobsPostedThisMonth: { type: Number, default: 0 },
      renewDate: { type: Date }, // when monthly counter resets
      premiumExpires: { type: Date },
      isPremiumActive: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

// --- Hash password only if not hashed ---
recruiterSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  if (
    this.password &&
    (this.password.startsWith("$2a$") || this.password.startsWith("$2b$"))
  )
    return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

recruiterSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Recruiter", recruiterSchema);