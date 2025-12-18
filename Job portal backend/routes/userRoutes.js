const express = require("express");
const router = express.Router();
const {
  bookmarkJob,
  deleteBookmark,
  deleteProfilePhoto,
  deleteResume,
  getAllBookmarks,
  getAppliedJobs,
  getUserProfile,
  sendUserEmailVerification,
  updateProfile,
  uploadProfilePhoto,
  uploadResume,
  verifyNewPhone,
  verifyUserEmail,
  withdrawApplication,
  applyJob,
} = require("../controllers/userController");
const { authMiddleware, authorize } = require("../middleware/authentication");
const {
  uploadProfile,
  uploadResume: resumeUpload,
} = require("../middleware/uploadMiddleware");

// Job Application
router.post("/apply", authMiddleware, authorize("user"), applyJob);

router.delete(
  "/applications/:jobId",
  authMiddleware,
  authorize("user"),
  withdrawApplication
); // New withdraw route
router.get("/applications", authMiddleware, authorize("user"), getAppliedJobs);

// Bookmarks (Saved Jobs)
router.post("/bookmarks", authMiddleware, authorize("user"), bookmarkJob);
router.get("/bookmarks", authMiddleware, authorize("user"), getAllBookmarks);
router.delete("/bookmarks/:jobId", authMiddleware, authorize("user"), deleteBookmark);

// User Profile
router.get("/profile", authMiddleware, authorize("user"), getUserProfile);
router.put("/profile", authMiddleware, authorize("user"), updateProfile);

// Resume
router.post(
  "/profile/resume",
  authMiddleware,
  authorize("user"),
  resumeUpload.single("resume"),
  uploadResume
);
router.delete("/profile/resume", authMiddleware, authorize("user"), deleteResume);

// Profile Photo
router.post(
  "/profile/photo",
  authMiddleware,
  authorize("user"),
  uploadProfile.single("photo"),
  uploadProfilePhoto
);
router.delete("/profile/photo", authMiddleware, authorize("user"), deleteProfilePhoto);

// Verifications
router.post("/profile/verify-phone", authMiddleware, authorize("user"), verifyNewPhone);
router.post(
  "/verify/email/send",
  authMiddleware,
  authorize("user"),
  sendUserEmailVerification
);
router.get("/verify/email/check", verifyUserEmail); // This is public as it's from a link

module.exports = router;
