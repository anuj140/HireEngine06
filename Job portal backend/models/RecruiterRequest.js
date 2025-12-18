const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const recruiterRequestSchema = new mongoose.Schema(
  {
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
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
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
    companyPAN: { type: String },
    udyamRegNo: { type: String },
    documents: [{ type: String }], // Cloudinary URLs
    phoneVerified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    adminNotes: { type: String },
  },
  { timestamps: true }
);

// Hash password
recruiterRequestSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model("RecruiterRequest", recruiterRequestSchema);
