const express = require("express");
const router = express.Router();
const { authMiddleware, authorize } = require("../middleware/authentication");
const { getAdminDashboardStats } = require("../controllers/adminDashboardController");

router.get("/stats", authMiddleware, authorize("admin"), getAdminDashboardStats);

module.exports = router;
