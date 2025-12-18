const jwt = require("jsonwebtoken");
const User = require("../models/User");
const TeamMember = require("../models/TeamMember");
const Recruiter = require("../models/Recruiter");
const Admin = require("../models/Admin");
require("dotenv").config();

// This is the primary authentication middleware for the entire application.
exports.authMiddleware = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return res.status(401).json({ success: false, msg: "Not authorized, no token" });
  }

  try {
    token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.id) {
      return res
        .status(401)
        .json({ success: false, msg: "Not authorized, token is invalid" });
    }

    let account = null;

    // 1. Check User model (JobSeeker, Admin)
    account = await User.findById(decoded.id).select("-password");

    // 2. Check Recruiter model if not found in User
    if (!account) {
      account = await Recruiter.findById(decoded.id).select("-password");

      if (account) {
        // Recruiter found - normalize and continue
        const userObject = account.toObject();
        userObject.role = "recruiter";

        // Ensure id property exists
        if (!userObject.id && userObject._id) {
          userObject.id = userObject._id.toString();
        }

        // For recruiters, they ARE the company, so set company to their own ID
        userObject.company = userObject._id;

        req.user = userObject;
        return next();
      }
    }

    // 3. Check TeamMember model if not found in User or Recruiter
    if (!account) {
      account = await TeamMember.findById(decoded.id).select("-password");

      if (account) {
        if (account.status !== "active") {
          return res.status(403).json({
            success: false,
            msg: "Your account is not active. Please contact your main recruiter.",
          });
        }

        const teamMemberObject = account.toObject();

        // Ensure id property exists
        if (!teamMemberObject.id && teamMemberObject._id) {
          teamMemberObject.id = teamMemberObject._id.toString();
        }

        // Set proper properties for team member
        teamMemberObject.recruiterId = account.recruiterId; // Link to main recruiter
        teamMemberObject.company = account.recruiterId; // Set company for TeamMember
        teamMemberObject.role = "HR Manager"; // Normalize role for frontend

        req.user = teamMemberObject;
        return next();
      }
    }

    // 4. Check Admin model
    if (!account) {
      account = await Admin.findById(decoded.id).select("-password");
      if (account) {
        const adminObject = account.toObject();
        if (!adminObject.id && adminObject._id) {
          adminObject.id = adminObject._id.toString();
        }
        // Ensure role is normalized
        adminObject.role = "Admin";
        req.user = adminObject;
        return next();
      }
    }

    if (!account) {
      return res
        .status(401)
        .json({
          success: false,
          msg: "Account not found for this token. Please log in again.",
        });
    }

    const userObject = account.toObject();

    // --- Normalize Roles ---
    // This ensures strict comparison works in authorize middleware
    if (userObject.role === "recruiter" || userObject.role === "Recruiter") {
      userObject.role = "Recruiter";
    } else if (userObject.role === "admin" || userObject.role === "Admin") {
      userObject.role = "Admin";
    } else {
      userObject.role = "user"; // JobSeeker
    }

    // Ensure id property exists for controllers expecting it
    if (!userObject.id && userObject._id) {
      userObject.id = userObject._id.toString();
    }

    req.user = userObject;
    next();
  } catch (error) {
    console.error("authMiddleware error:", error);
    return res
      .status(401)
      .json({ success: false, msg: "Not authorized, token failed or expired." });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res
        .status(401)
        .json({ success: false, msg: "Not authorized: user role not found." });
    }

    // Normalization for check - remove spaces and convert to lowercase
    const userRole = req.user.role.toLowerCase().replace(/\s+/g, "");
    const allowedRoles = roles.map((r) => r.toLowerCase().replace(/\s+/g, ""));

    // Special case: 'recruiter' allows 'hrmanager' (team_member) for many shared routes
    if (
      allowedRoles.includes("recruiter") &&
      (userRole === "hrmanager" || userRole === "team_member")
    ) {
      return next();
    }

    if (allowedRoles.includes("user") && userRole === "jobseeker") {
      return next();
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        msg: `Forbidden: Role '${req.user.role}' is not allowed to access this resource.`,
      });
    }

    next();
  };
};
