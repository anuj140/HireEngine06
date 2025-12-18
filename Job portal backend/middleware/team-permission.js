const TeamMember = require("../models/TeamMember");

// Middleware to check specific permissions for team members (HR Managers)
exports.checkTeamPermission = (permission) => {
  return async (req, res, next) => {
    try {
      // Normalize role for comparison (remove spaces, lowercase)
      const userRole = (req.user?.role || "").toLowerCase().replace(/\s+/g, "");

      // Main recruiter (Admin) has full access
      if (userRole === "recruiter" || userRole === "admin") {
        return next();
      }

      // HR Manager (team_member) – check stored permissions
      if (userRole === "team_member" || userRole === "hrmanager") {
        const teamMember = await TeamMember.findById(req.user.id);
        if (teamMember && teamMember.permissions && teamMember.permissions[permission]) {
          return next();
        }
      }

      // Permission denied
      return res.status(403).json({
        success: false,
        message: "You don't have permission to perform this action",
      });
    } catch (error) {
      console.error("Permission check error:", error);
      return res.status(500).json({
        success: false,
        message: "Permission check failed",
      });
    }
  };
};

// Export specific permission checkers
exports.canManageJobs = exports.checkTeamPermission("canManageJobs");
exports.canManageApplications = exports.checkTeamPermission("canManageApplications");
exports.canViewAnalytics = exports.checkTeamPermission("canViewAnalytics");
exports.canViewApprovals = exports.checkTeamPermission("canViewApprovals");
exports.canManageCompanyProfile = exports.checkTeamPermission("canManageCompanyProfile");