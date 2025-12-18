const TeamMember = require("../models/TeamMember");
const Recruiter = require("../models/Recruiter");
// Custom Errors
const BadRequestError = require("../errors/bad-request");
const NotFoundError = require("../errors/not-found");
const ForbiddenError = require("../errors/forbidden-error");
//#
const { generateInvitationToken, generateToken } = require("../utils/generateToken");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

// Helper function to get default permissions based on role
const getDefaultPermissions = (role) => {
  if (role === 'team_member') {
    // Regular Team Member: Jobs post, jobs see, dashboard, shortlisted only
    return {
      canManageJobs: true,
      canViewApplications: true,
      canManageApplications: true,
      canViewAnalytics: false,
      canViewApprovals: false,
      canManageCompanyProfile: false,
    };
  } else {
    // Manager (recruiter): Jobs analytics, Approvals, dashboard
    return {
      canManageJobs: false,
      canViewApplications: false,
      canManageApplications: false,
      canViewAnalytics: true,
      canViewApprovals: true,
      canManageCompanyProfile: false,
    };
  }
};

// Invite team member (HR Manager)
exports.inviteTeamMember = async (req, res, next) => {
  try {
    const { name, email, role } = req.body;
    const mainRecruiterId = req.user.id;

    if (!name || !email || !role) {
      throw new BadRequestError("Name, email and role are required");
    }

    if (!["team_member", "recruiter"].includes(role)) {
      throw new BadRequestError("Role must be either 'team_member' or 'recruiter'");
    }

    // ---- Subscription Check ----
    const { checkTeamAddOnLimits, incrementTeamCounter } = require("../utils/subscriptionHelper");
    // Check limits before proceeding
    const subscription = await checkTeamAddOnLimits(mainRecruiterId, role);
    // ----------------------------

    // Check if email already exists in team
    const existingMember = await TeamMember.findOne({
      email: email.toLowerCase(),
      recruiterId: mainRecruiterId,
    });
    if (existingMember) {
      throw new BadRequestError("Team member with this email already exists");
    }

    // Check if email exists in other recruiters
    const emailExists = await TeamMember.findOne({
      email: email.toLowerCase(),
      recruiterId: { $ne: mainRecruiterId },
    });
    if (emailExists) {
      throw new BadRequestError("This email is already used by another company");
    }

    // Generate temporary password
    const tempPassword = crypto.randomBytes(8).toString("hex");

    // Create team member with "invited" status
    const teamMember = await TeamMember.create({
      recruiterId: mainRecruiterId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: tempPassword,
      role,
      permissions: getDefaultPermissions(role),
      status: "invited",
      invitedBy: mainRecruiterId,
      invitationExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    // Generate invitation token
    teamMember.invitationToken = generateInvitationToken(
      teamMember.email,
      mainRecruiterId,
      teamMember._id
    );
    await teamMember.save();

    // Get recruiter company name for email
    const recruiter = await Recruiter.findById(mainRecruiterId);

    // Send invitation email
    const invitationLink = `${process.env.CLIENT_URL}/accept-invitation?token=${teamMember.invitationToken}`;

    await sendEmail({
      to: teamMember.email,
      template: "team_member_invitation",
      variables: {
        name: teamMember.name,
        companyName: recruiter.companyName,
        role: teamMember.role,
        invitationLink,
      },
    });

    // Add to recruiter's team members
    await Recruiter.findByIdAndUpdate(mainRecruiterId, {
      $push: { teamMembers: teamMember._id },
    });

    // ---- Increment Subscription Counter ----
    await incrementTeamCounter(subscription, role);
    // ----------------------------------------

    res.status(201).json({
      success: true,
      message: "Team member invited successfully",
      teamMember: {
        id: teamMember._id,
        name: teamMember.name,
        email: teamMember.email,
        role: teamMember.role,
        status: teamMember.status,
        permissions: teamMember.permissions,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Get all team members
exports.getTeamMembers = async (req, res, next) => {
  try {
    const recruiterId = req.user.id;

    const teamMembers = await TeamMember.find({ recruiterId })
      .select("-password -invitationToken")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: teamMembers.length,
      teamMembers,
    });
  } catch (err) {
    next(err);
  }
};

// Update team member role and permissions
exports.updateTeamMemberRole = async (req, res, next) => {
  try {
    const { teamMemberId } = req.params;
    const { role, permissions } = req.body;
    const mainRecruiterId = req.user.id;

    const teamMember = await TeamMember.findOne({
      _id: teamMemberId,
      recruiterId: mainRecruiterId,
    });
    if (!teamMember) {
      throw new NotFoundError("Team member not found");
    }

    const updateData = {};
    if (role && ["team_member", "recruiter"].includes(role)) {
      updateData.role = role;
      // Set default permissions based on role if not provided
      if (!permissions) {
        updateData.permissions = getDefaultPermissions(role);
      }
    }
    if (permissions) {
      updateData.permissions = {
        ...teamMember.permissions,
        ...permissions,
      };
    }

    const updatedMember = await TeamMember.findByIdAndUpdate(
      teamMemberId,
      { $set: updateData },
      { new: true }
    ).select("-password -invitationToken");

    res.status(200).json({
      success: true,
      message: "Team member updated successfully",
      teamMember: updatedMember,
    });
  } catch (err) {
    next(err);
  }
};

// Pause/Activate team member account
exports.toggleTeamMemberStatus = async (req, res, next) => {
  try {
    const { teamMemberId } = req.params;
    const { status } = req.body;
    const mainRecruiterId = req.user.id;

    if (!["active", "paused"].includes(status)) {
      throw new BadRequestError("Status must be either 'active' or 'paused'");
    }

    const teamMember = await TeamMember.findOne({
      _id: teamMemberId,
      recruiterId: mainRecruiterId,
    });
    if (!teamMember) {
      throw new NotFoundError("Team member not found");
    }

    // Cannot pause yourself
    if (teamMember._id.toString() === req.user.id && req.user.role === "team_member") {
      throw new ForbiddenError("You cannot pause your own account");
    }

    const updatedMember = await TeamMember.findByIdAndUpdate(
      teamMemberId,
      { status },
      { new: true }
    ).select("-password -invitationToken");

    res.status(200).json({
      success: true,
      message: `Team member ${status} successfully`,
      teamMember: updatedMember,
    });
  } catch (err) {
    next(err);
  }
};

// Change team member password (by main recruiter)
exports.changeTeamMemberPassword = async (req, res, next) => {
  try {
    const { teamMemberId } = req.params;
    const { newPassword } = req.body;
    const mainRecruiterId = req.user.id;

    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestError("Password must be at least 6 characters long");
    }

    const teamMember = await TeamMember.findOne({
      _id: teamMemberId,
      recruiterId: mainRecruiterId,
    });
    if (!teamMember) {
      throw new NotFoundError("Team member not found");
    }

    teamMember.password = newPassword;
    await teamMember.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (err) {
    next(err);
  }
};

// Remove team member
exports.removeTeamMember = async (req, res, next) => {
  try {
    const { teamMemberId } = req.params;
    const mainRecruiterId = req.user.id;

    const teamMember = await TeamMember.findOne({
      _id: teamMemberId,
      recruiterId: mainRecruiterId,
    });

    if (!teamMember) {
      throw new NotFoundError("Team member not found");
    }

    // Cannot remove yourself
    if (teamMember._id.toString() === req.user.id && req.user.role === "team_member") {
      throw new ForbiddenError("You cannot remove your own account");
    }

    await TeamMember.findByIdAndDelete(teamMemberId);

    // Remove from recruiter's team members array
    await Recruiter.findByIdAndUpdate(mainRecruiterId, {
      $pull: { teamMembers: teamMemberId },
    });

    // ---- Decrement Subscription Counter ----
    const { getActiveSubscription, decrementTeamCounter } = require("../utils/subscriptionHelper");
    // We try to get subscription, if it fails (e.g. expired), we might skip decrement or handle gracefully
    try {
      const subscription = await getActiveSubscription(mainRecruiterId);
      await decrementTeamCounter(subscription, teamMember.role);
    } catch (e) {
      console.warn("Could not decrement team counter:", e.message);
    }
    // ----------------------------------------

    res.status(200).json({
      success: true,
      message: "Team member removed successfully",
    });
  } catch (err) {
    next(err);
  }
};

// Accept invitation and set up account
exports.acceptInvitation = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      throw new BadRequestError("Token and password are required");
    }

    if (password.length < 6) {
      throw new BadRequestError("Password must be at least 6 characters long");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const teamMember = await TeamMember.findOne({
      _id: decoded.teamMemberId,
      invitationToken: token,
      invitationExpires: { $gt: new Date() },
    });

    if (!teamMember) {
      throw new BadRequestError("Invalid or expired invitation token");
    }

    // Update team member
    teamMember.password = password;
    teamMember.status = "active";
    teamMember.invitationToken = undefined;
    teamMember.invitationExpires = undefined;
    teamMember.lastActive = new Date();
    await teamMember.save();

    res.status(200).json({
      success: true,
      message: "Account activated successfully",
      token: generateToken(teamMember._id, "team_member"),
      teamMember: {
        id: teamMember._id,
        name: teamMember.name,
        email: teamMember.email,
        role: 'HR Manager', // Normalize for frontend
        permissions: teamMember.permissions,
        recruiterId: teamMember.recruiterId,
      },
    });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(400).json({
        success: false,
        message: "Invitation link has expired",
      });
    }
    next(err);
  }
};

// Team member login
exports.teamMemberLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    console.log(`🔐 Team Login Attempt: ${email}`);

    if (!email || !password) {
      console.log("❌ Missing email or password");
      throw new BadRequestError("Email and password are required");
    }

    const teamMember = await TeamMember.findOne({ email: email.toLowerCase().trim() });
    if (!teamMember) {
      console.log("❌ Team member not found");
      throw new BadRequestError("Invalid credentials");
    }

    // Check if account is paused
    if (teamMember.status === "paused") {
      console.log("❌ Account paused");
      throw new BadRequestError("Your account has been paused. Please contact your administrator.");
    }

    // Check if account is still in invited status
    if (teamMember.status === "invited") {
      console.log("❌ Account invited but not active");
      throw new BadRequestError("Please accept your invitation first to activate your account.");
    }

    if (teamMember.status !== "active") {
      console.log(`❌ Account status: ${teamMember.status}`);
      throw new BadRequestError("Your account is not active. Please contact your administrator.");
    }

    const isMatch = await teamMember.matchPassword(password);
    if (!isMatch) {
      console.log("❌ Password mismatch");
      throw new BadRequestError("Invalid credentials");
    }

    // Update last active
    teamMember.lastActive = new Date();
    await teamMember.save();

    console.log("✅ Team member login successful");
    res.status(200).json({
      success: true,
      token: generateToken(teamMember._id, "team_member"),
      teamMember: {
        id: teamMember._id,
        name: teamMember.name,
        email: teamMember.email,
        role: 'HR Manager', // Normalize for frontend
        permissions: teamMember.permissions,
        recruiterId: teamMember.recruiterId,
      },
    });
  } catch (err) {
    console.error("❌ Login Error:", err.message);
    next(err);
  }
};

// Get team member profile
exports.getTeamMemberProfile = async (req, res, next) => {
  try {
    const teamMember = await TeamMember.findById(req.user.id)
      .select("-password -invitationToken")
      .populate("recruiterId", "companyName companyWebsite");

    if (!teamMember) {
      throw new NotFoundError("Team member not found");
    }

    res.status(200).json({
      success: true,
      teamMember,
    });
  } catch (err) {
    next(err);
  }
};
