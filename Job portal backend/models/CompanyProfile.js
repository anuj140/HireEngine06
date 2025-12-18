// models/CompanyProfile.js
const mongoose = require("mongoose");

// Single section schema
const sectionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    image: { type: String }, // single image
    description: { type: String },
  },
  { _id: false }
);

// Single gallery section schema (multiple images)
const gallerySectionSchema = new mongoose.Schema(
  {
    title: { type: String },
    images: {
      type: [String],
      validate: [arrayLimit, "{PATH} exceeds the limit of 10 images"],
    },
    description: { type: String },
  },
  { _id: false }
);

// Leader schema
const leaderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    role: { type: String },
    image: { type: String }, // single image per leader
  },
  { _id: false }
);

// Key highlight schema
const keyHighlightSchema = new mongoose.Schema(
  {
    icon: { type: String },
    title: { type: String },
    subtitle: { type: String },
  },
  { _id: false }
);

// Award schema
const awardSchema = new mongoose.Schema(
  {
    year: { type: String },
    title: { type: String },
  },
  { _id: false }
);

// Validator function for max array length
function arrayLimit(val) {
  return val.length <= 10;
}

// Main company profile schema
const companyProfileSchema = new mongoose.Schema(
  {
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recruiter",
      required: true,
      unique: true,
    },
    companyName: { type: String, required: true },
    bannerImage: { type: String },
    tagline: { type: String, required: true },
    companyTags: { type: [String], default: [] },
    about: {
      description: { type: String },
      videoUrl: { type: String },
    },
    section: sectionSchema, // single section
    gallerySection: gallerySectionSchema, // single gallery section with multiple images
    leaders: { type: [leaderSchema], default: [] },
    keyHighlights: {
      type: [keyHighlightSchema],
      default: [],
      validate: [arrayLimit, "Maximum 10 key highlights allowed"],
    },
    awards: {
      type: [awardSchema],
      default: [],
      validate: [arrayLimit, "Maximum 10 awards allowed"],
    },
    companyDetails: {
      type: { type: String },
      size: { type: String },
      foundedYear: { type: String },
      headquarters: { type: String },
      website: { type: String },
    },
    socialMedia: {
      youtube: { type: String },
      twitter: { type: String },
      facebook: { type: String },
      instagram: { type: String },
      linkedin: { type: String },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CompanyProfile", companyProfileSchema);
