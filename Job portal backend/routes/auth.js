const express = require("express");
const router = express.Router();
const { login, sendOtp, verifyOtp, registerUser, registerAdmin, forgotPassword, resetPassword } = require("../controllers/auth");
const {
  sendUserEmailVerification,
  verifyUserEmail,
} = require("../controllers/userController");

// User registration
router.post("/register/user", registerUser);

// Login
router.post("/login", login);

// Admin account creation for initial setup
router.post("/signup/admin", registerAdmin);


// Phone verification
router.post("/verify/phone/send", sendOtp);
router.post("/verify/phone/check", verifyOtp);

// Email verification (optional, after registration)
router.post("/verify/email/send", sendUserEmailVerification);
router.get("/verify/email/check", verifyUserEmail);

// Password Reset
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);



module.exports = router;