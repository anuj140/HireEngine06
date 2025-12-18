const express = require("express");
const router = express.Router();
const { authMiddleware, authorize } = require("../middleware/authentication");
const {
  inviteTeamMember,
  getTeamMembers,
  updateTeamMemberRole,
  toggleTeamMemberStatus,
  changeTeamMemberPassword,
  removeTeamMember,
  acceptInvitation,
  teamMemberLogin,
  getTeamMemberProfile,
} = require("../controllers/teamController");

// Public routes
router.post("/accept-invitation", acceptInvitation);
router.post("/login", teamMemberLogin);

// Protected routes - team members
router.get("/profile", authMiddleware, authorize("team_member"), getTeamMemberProfile);

// Protected routes - main recruiter only
router.post("/invite", authMiddleware, authorize("recruiter"), inviteTeamMember);
router.get("/members", authMiddleware, authorize("recruiter"), getTeamMembers);
router.put("/members/:teamMemberId/role", authMiddleware, authorize("recruiter"), updateTeamMemberRole);
router.patch("/members/:teamMemberId/status", authMiddleware, authorize("recruiter"), toggleTeamMemberStatus);
router.put("/members/:teamMemberId/password", authMiddleware, authorize("recruiter"), changeTeamMemberPassword);
router.delete("/members/:teamMemberId", authMiddleware, authorize("recruiter"), removeTeamMember);

module.exports = router;