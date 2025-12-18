const express = require("express");
const router = express.Router();
const { authMiddleware, authorize } = require("../middleware/authentication");
const { canManageJobs } = require("../middleware/team-permission");

// Import controllers
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

const {
  changeJobStatus,
  updateJob,
  deleteJob,
  getAllPostedJobs,
  getRecruiterJobById,
} = require("../controllers/recruiterController");

// --- From original jobApprovalRoutes.js ---
// HR Manager/Recruiter posts job (requires approval)
router.post(
  "/post-job",
  authMiddleware,
  authorize("team_member", "recruiter"),
  canManageJobs,
  createJobForApproval
);

// HR Manager gets their own job posts
router.get(
  "/my-jobs",
  authMiddleware,
  authorize("team_member", "recruiter"),
  canManageJobs,
  getMyJobPosts
);

// Recruiter gets pending jobs for approval
router.get("/pending", authMiddleware, authorize("recruiter"), getPendingJobs);

// Recruiter gets specific job details for approval
router.get("/pending/:jobId", authMiddleware, authorize("recruiter"), getJobForApproval);

// Recruiter approves a job
router.patch(
  "/pending/:jobId/approve",
  authMiddleware,
  authorize("recruiter"),
  approveJob
);

// Recruiter rejects a job
router.patch("/pending/:jobId/reject", authMiddleware, authorize("recruiter"), rejectJob);

// Recruiter gets approval statistics
router.get("/stats", authMiddleware, authorize("recruiter"), getApprovalStats);

// Main Recruiter: Get all pending jobs from their HR Managers
router.get(
  "/recruiter/pending",
  authMiddleware,
  authorize("recruiter"),
  getPendingJobsForRecruiter
);

// --- Routes moved from recruiterRoutes.js ---
// Get all jobs for the logged-in recruiter/team-member
router.get(
  "/",
  authMiddleware,
  authorize("recruiter", "team_member"),
  canManageJobs,
  getAllPostedJobs
);

// Get a single job by ID (for editing)
router.get(
  "/:jobId",
  authMiddleware,
  authorize("recruiter", "team_member"),
  canManageJobs,
  getRecruiterJobById
);

// Update a job
router.put(
  "/:jobId",
  authMiddleware,
  authorize("recruiter", "team_member"),
  canManageJobs,
  updateJob
);

// Delete a job
router.delete(
  "/:jobId",
  authMiddleware,
  authorize("recruiter", "team_member"),
  canManageJobs,
  deleteJob
);

// Change job status (pause, resume, close)
router.patch(
  "/status",
  authMiddleware,
  authorize("recruiter", "team_member"),
  canManageJobs,
  changeJobStatus
);

module.exports = router;
