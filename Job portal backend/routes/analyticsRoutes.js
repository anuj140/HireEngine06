const express = require("express");
const router = express.Router();
const { getAdminAnalytics } = require("../controllers/analyticsController");
const { authMiddleware, authorize } = require("../middleware/authentication");

// Protected Admin Route
router.get("/", authMiddleware, authorize("admin", "Admin"), getAdminAnalytics);

module.exports = router;
