const express = require("express");
const router = express.Router();
const { authMiddleware, authorize } = require("../middleware/authentication");
const {
  canManageJobs,
  canManageApplications,
  canViewAnalytics,
  canManageCompanyProfile,
} = require("../middleware/team-permission");
const {
  changeApplicantStatus,
  getRecruiterAnalytics,
  searchApplicants,
  bulkUpdateApplicants,
  downloadResumes,
  bulkSendEmail,
  getApplicantsForJob,
  getAllApplicants,
  getPublicCompanies,
  getPublicCompanyById,
  addNote,
} = require("../controllers/recruiterController");
const {
  upsertCompanyProfile,
  getRecruiterProfile,
} = require("../controllers/recruiterProfileController");
// const notifyApplicationStatus = require('../services/notificationService')
// const { uploadRecruiterMedia } = require("../middleware/uploadMiddleware");
const {
const {
  inviteTeamMember,
  getTeamMembers,
  updateTeamMemberRole,
  removeTeamMember,
} = require("../controllers/teamController");

// --- Public Company Routes ---
router.get("/companies", getPublicCompanies);
router.get("/company/:id", getPublicCompanyById);

// Application management routes - require canManageApplications permission
router.get(
  "/applicants/all",
  authMiddleware,
  authorize("recruiter", "team_member"),
  canManageApplications,
  getAllApplicants
);
router.get(
  "/applicants/search",
  authMiddleware,
  authorize("recruiter", "team_member"),
  canManageApplications,
  searchApplicants
);
router.get(
  "/applicants/job/:jobId",
  authMiddleware,
  authorize("recruiter", "team_member"),
  canManageApplications,
  getApplicantsForJob
);
router.put(
  "/application-status",
  authMiddleware,
  authorize("recruiter", "team_member"),
  canManageApplications,
  changeApplicantStatus
);
router.post(
  "/applicants/bulk-update",
  authMiddleware,
  authorize("recruiter", "team_member"),
  canManageApplications,
  bulkUpdateApplicants
);
router.post(
  "/applicants/bulk-email",
  authMiddleware,
  authorize("recruiter", "team_member"),
  canManageApplications,
  bulkSendEmail
);
router.post(
  "/applicants/note",
  authMiddleware,
  authorize("recruiter", "team_member"),
  canManageApplications,
  addNote
);

// Analytics routes - require canViewAnalytics permission
router.get(
  "/analytics",
  authMiddleware,
  authorize("recruiter", "team_member"),
  canViewAnalytics,
  getRecruiterAnalytics
);

// Resume download - require canManageApplications permission
router.post(
  "/applicants/download-resumes",
  authMiddleware,
  authorize("recruiter", "team_member"),
  canManageApplications,
  downloadResumes
);

// Company profile - require canManageCompanyProfile permission (only main recruiter)
router.get(
  "/profile",
  authMiddleware,
  authorize("recruiter", "team_member"),
  getRecruiterProfile
);

// The `uploadRecruiterMedia` middleware is removed to handle base64 strings in the controller.
router.post(
  "/profile",
  authMiddleware,
  authorize("recruiter", "team_member"),
  canManageCompanyProfile,
  upsertCompanyProfile
);

// --- Team Management Routes ---
router.post("/team/invite", authMiddleware, authorize("recruiter"), inviteTeamMember);
router.get(
  "/team/members",
  authMiddleware,
  authorize("recruiter", "team_member"),
  getTeamMembers
);
router.put(
  "/team/members/:teamMemberId/role",
  authMiddleware,
  authorize("recruiter"),
  updateTeamMemberRole
);
router.delete(
  "/team/members/:teamMemberId",
  authMiddleware,
  authorize("recruiter"),
  removeTeamMember
);

module.exports = router;
