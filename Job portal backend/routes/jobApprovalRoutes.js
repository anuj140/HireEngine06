const express = require("express");
const router = express.Router();
const { authMiddleware, authorize } = require("../middleware/authentication");
const { canManageJobs } = require("../middleware/team-permission");
const {
  createJobForApproval,
  getPendingJobs,
  getJobForApproval,
  approveJob,
  rejectJob,
  getApprovalStats,
  getMyJobPosts,
  getPendingJobsForRecruiter,
} = require("../controllers/jobApprovalController");

// HR Manager posts job (requires approval)
router.post(
  "/post-job",
  authMiddleware,
  authorize("team_member", "recruiter"),
  canManageJobs,
  createJobForApproval
);

// HR Manager gets their job posts
router.get(
  "/my-jobs",
  authMiddleware,
  authorize("team_member", "recruiter"),
  canManageJobs,
  getMyJobPosts
);

// Recruiter gets pending jobs for approval
router.get("/pending", authMiddleware, authorize("recruiter"), getPendingJobs);

// Recruiter gets job details for approval
router.get("/pending/:jobId", authMiddleware, authorize("recruiter"), getJobForApproval);

// Recruiter approves job
router.patch(
  "/pending/:jobId/approve",
  authMiddleware,
  authorize("recruiter"),
  approveJob
);

// Recruiter rejects job
router.patch("/pending/:jobId/reject", authMiddleware, authorize("recruiter"), rejectJob);

// Recruiter gets approval statistics
router.get("/stats", authMiddleware, authorize("recruiter"), getApprovalStats);

// ✅ Main Recruiter: Get all pending jobs from HR Managers
router.get(
  "/recruiter/pending",
  authMiddleware,
  authorize("recruiter"), // only main recruiter can see this
  getPendingJobsForRecruiter
);

module.exports = router;
