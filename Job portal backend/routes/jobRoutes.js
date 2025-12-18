
const express = require("express");
const router = express.Router();

const { getJobs, getRecommendedJobs, getJobById } = require("../controllers/jobController");
const { authMiddleware, authorize } = require("../middleware/authentication");

// Public browsing endpoints
router.get("/", getJobs);

// Private recommended jobs route - MUST be before /:id
router.get('/recommended', authMiddleware, authorize('user', 'JobSeeker'), getRecommendedJobs);

// Must be the last route
router.get("/:id", getJobById);

module.exports = router;
