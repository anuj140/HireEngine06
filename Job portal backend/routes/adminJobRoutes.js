
const express = require("express");
const router = express.Router();
const { getAllJobs, updateJobStatus } = require("../controllers/adminJobController");
const { authMiddleware, authorize } = require("../middleware/authentication");

router.get("/", authMiddleware, authorize("admin"), getAllJobs);

router.put("/:jobId/status", authMiddleware, authorize("admin"), updateJobStatus);

module.exports = router;
