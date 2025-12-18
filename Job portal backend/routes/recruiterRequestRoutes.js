const express = require("express");
const router = express.Router();

const { uploadRecruiterDocs } = require("../middleware/uploadMiddleware");
const { createRecruiterRequest, sendRecruiterPhoneOtp, verifyRecruiterPhoneOtp, verifyRecruiterEmail, uploadRecruiterDocuments, sendRecruiterEmailVerification } = require("../controllers/recruiterRequestController");

// Public: recruiter applies
router.post("/", createRecruiterRequest);

// Phone OTP routes
router.post("/verify/phone/send", sendRecruiterPhoneOtp); // recruiter sends OTP request
router.post("/verify/phone/check", verifyRecruiterPhoneOtp); // recruiter verifies OTP

// Email verification routes
router.post("/email/send", sendRecruiterEmailVerification);
router.get("/email/check", verifyRecruiterEmail);

// Recruiter uploads supporting docs (pending recruiter)
router.post(
  "/documents/upload",
  uploadRecruiterDocs.array("files", 5),
  uploadRecruiterDocuments
);

module.exports = router;