const mongoose = require("mongoose");

const NavigationItemSchema = new mongoose.Schema({
  label: { type: String, required: true },
  url: { type: String, required: true },
  order: { type: Number, default: 0 },
  target: { type: String, enum: ["_self", "_blank"], default: "_self" }
}, { _id: false });

const SocialLinkSchema = new mongoose.Schema({
  platform: { 
    type: String, 
    enum: ["facebook", "twitter", "linkedin", "instagram", "youtube", "github"],
    required: true 
  },
  url: { type: String, required: true },
  icon: { type: String }
}, { _id: false });

const ContactInfoSchema = new mongoose.Schema({
  email: { type: String },
  phone: { type: String },
  address: { type: String },
  workingHours: { type: String }
}, { _id: false });

const FooterSectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  links: [NavigationItemSchema]
}, { _id: false });

const WebsiteSettingsSchema = new mongoose.Schema({
  // Site Identity
  siteTitle: { type: String, default: "Job Portal" },
  siteDescription: { type: String, default: "Find your dream job or perfect candidate" },
  siteKeywords: [{ type: String }],
  
  // Branding
  logoUrl: { type: String },
  faviconUrl: { type: String },
  primaryColor: { 
    type: String, 
    default: "#3b82f6",
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format"]
  },
  secondaryColor: { 
    type: String, 
    default: "#10b981",
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format"]
  },
  
  // Header/Navigation
  headerLogoUrl: { type: String },
  navigationItems: [NavigationItemSchema],
  
  // Footer
  footerSections: [FooterSectionSchema],
  footerCopyright: { type: String, default: "© 2024 Job Portal. All rights reserved." },
  
  // Social Links
  socialLinks: [SocialLinkSchema],
  
  // Contact Information
  contactInfo: { type: ContactInfoSchema, default: {} },
  
  // Meta
  metaTags: { type: Map, of: String }, // For custom meta tags
  
  // Version tracking for cache busting
  version: { type: Number, default: 1 },
  
  // Last updated by
  lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" }
}, { 
  timestamps: true,
  collection: "websiteSettings" 
});

// Ensure only one document exists
WebsiteSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model("WebsiteSettings", WebsiteSettingsSchema);