const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const teamMemberSchema = new mongoose.Schema(
  {
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recruiter",
      required: true,
    },
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [
        /^\S+@\S+\.\S+$/,
        "Please provide a valid email",
      ],
    },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["team_member", "recruiter"], // "recruiter" is main recruiter (admin)
      required: true,
    },
    permissions: {
      // Default permissions for a regular team member (recruiter assistant)
      canManageJobs: { type: Boolean, default: true }, // can post & edit jobs
      canViewApplications: { type: Boolean, default: false },
      canManageApplications: { type: Boolean, default: false },
      canViewAnalytics: { type: Boolean, default: false }, // manager gets true via API
      canViewApprovals: { type: Boolean, default: false },
      canManageCompanyProfile: { type: Boolean, default: false },
    },
    status: {
      type: String,
      enum: ["active", "paused", "invited"],
      default: "invited",
    },
    lastActive: { type: Date },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recruiter",
      required: true,
    },
    invitationToken: { type: String },
    invitationExpires: { type: Date },
  },
  { timestamps: true }
);

// Hash password before saving
teamMemberSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Match password method
teamMemberSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Indexes for faster queries
teamMemberSchema.index({ recruiterId: 1, email: 1 });
teamMemberSchema.index({ invitationToken: 1 });

module.exports = mongoose.model("TeamMember", teamMemberSchema);