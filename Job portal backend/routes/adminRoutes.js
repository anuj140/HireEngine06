
const express = require("express");
const router = express.Router();
const { authMiddleware, authorize } = require("../middleware/authentication");
const {
  blockAccount,
  approveRecruiterRequest,
  rejectRecruiterRequest,
  getAdminProfile,
  getPendingRecruiterRequests,
  getRecruiterRequestStats,
} = require("../controllers/adminController");
const { registerAdmin } = require("../controllers/auth");

// Admin Profile
router.get("/me", authMiddleware, authorize("admin"), getAdminProfile);

router.post("/block", authMiddleware, authorize("admin"), blockAccount);

// Admin: approve/reject pending recruiter
router.get("/recruiter-requests/pending", authMiddleware, authorize("admin"), getPendingRecruiterRequests);
router.get("/recruiter-requests/stats", authMiddleware, authorize("admin"), getRecruiterRequestStats);
router.put("/approve", authMiddleware, authorize("admin"), approveRecruiterRequest);
router.put("/reject", authMiddleware, authorize("admin"), rejectRecruiterRequest);

router.post("/register-admin", registerAdmin);

module.exports = router;
