const sendEmail = require("../utils/sendEmail");

const generateEmailToken = require("../utils/genrateEmailToken");

const User = require("../models/User");
const Admin = require("../models/Admin");
const TeamMember = require("../models/TeamMember");
const Recruiter = require("../models/Recruiter");
const PhoneVerification = require("../models/PhoneVerification");
const twilio = require("twilio");
const jwt = require("jsonwebtoken");
const { generateToken } = require("../utils/generateToken");
require("dotenv").config();


const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Step 1: Send OTP to phone
exports.sendOtp = async (req, res, next) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ message: "Phone number is required" });

  try {
    // Check if a user with this phone number already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "A user with this phone number already exists." });
    }

    // DEVELOPMENT: Bypassing Twilio OTP sending due to trial account limitations.
    // In production, the following block should be uncommented and the simulation block removed.
    /*
    await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({ to: phone, channel: "sms" });
    */

    // Create or refresh temp record for the OTP flow simulation
    await PhoneVerification.findOneAndUpdate(
      { phone },
      { verified: false, expiresAt: new Date(Date.now() + 15 * 60 * 1000) }, // 15 min validity
      { upsert: true, new: true }
    );

    // For development, inform the user about the magic OTP via the success message.
    res
      .status(200)
      .json({ success: true, message: "OTP Sent! (For testing, use 123456)" });
  } catch (err) {
    next(err);
  }
};

exports.verifyOtp = async (req, res, next) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) return res.status(400).json({ message: "Phone and OTP required" });

  try {
    // DEVELOPMENT: Bypassing Twilio verification. Use a magic OTP.
    // In a production environment, this block should be replaced with the real verification logic below.
    if (otp === "123456") {
      await PhoneVerification.findOneAndUpdate(
        { phone },
        { verified: true, expiresAt: new Date(Date.now() + 15 * 60 * 1000) },
        { upsert: true }
      );

      return res.status(200).json({
        success: true,
        message: "Phone verified successfully. You can now register.",
      });
    }

    // PRODUCTION: Uncomment this block for live OTP verification.
    /*
    const verification_check = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({ to: phone, code: otp });

    if (verification_check.status === "approved") {
      await PhoneVerification.findOneAndUpdate(
        { phone },
        { verified: true, expiresAt: new Date(Date.now() + 15 * 60 * 1000) }, // keep record for registration
        { upsert: true }
      );

      return res.status(200).json({
        success: true,
        message: "Phone verified successfully. You can now register.",
      });
    }
    */

    res.status(400).json({ success: false, message: "Invalid or expired OTP" });
  } catch (err) {
    next(err);
  }
};

// User Registration
exports.registerUser = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password || !phone) {
      return res
        .status(400)
        .json({ message: "Name, email, password, and phone are required." });
    }

    // Check if user already exists
    const userExist = await User.findOne({ $or: [{ email }, { phone }] });
    if (userExist) {
      return res
        .status(400)
        .json({ message: "User with this email or phone already exists" });
    }

    // Check if phone is verified
    const phoneRecord = await PhoneVerification.findOne({ phone, verified: true });
    if (!phoneRecord) {
      return res.status(400).json({
        message:
          "Phone number not verified or verification expired. Please verify your phone number first.",
      });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      phone: phone,
      phoneVerified: true,
      emailVerified: false,
    });

    // Clean up verification record
    await PhoneVerification.deleteOne({ _id: phoneRecord._id });

    const userToReturn = user.toObject();
    delete userToReturn.password;

    // Respond with token
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: userToReturn,
      token: generateToken(user._id, user.role),
    });
  } catch (err) {
    next(err);
  }
};

// Block entering user with unverified phone number
exports.login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    let account;
    let isMainRecruiter = false;

    if (role === "user") {
      account = await User.findOne({ email });
    } else if (role === "recruiter") {
      // For company login, check both Recruiter and TeamMember models
      account = await Recruiter.findOne({ email });
      isMainRecruiter = !!account;
      if (!account) {
        account = await TeamMember.findOne({ email });
      }
    } else if (role === "admin") {
      account = await Admin.findOne({ email });
    } else {
      return res.status(400).json({ msg: "Invalid role" });
    }

    if (!account) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    const isMatch = await account.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    const token = generateToken(account._id, account.role);

    const userToReturn = account.toObject();
    delete userToReturn.password;

    //! Most Critical flaw:
    //! For frontend backend code changes, which causes unexpected error and bugs
    // Normalize the role for the frontend which expects 'Admin', 'HR Manager', 'Recruiter'
    if (role === "recruiter") {
      if (isMainRecruiter) {
        // Main recruiter is the company Admin
        userToReturn.role = "Admin";
      } else if (userToReturn.role) {
        // This is a TeamMember
        if (userToReturn.role === "team_member") {
          userToReturn.role = "HR Manager"; // As per comment in TeamMember model
        } else if (userToReturn.role === "recruiter") {
          userToReturn.role = "Recruiter";
        }
      }
    }

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: userToReturn,
    });
  } catch (err) {
    next(err);
  }
};

//* registerAdmin fully understand - STATUS(200)
// Admin registration - initial setup only
exports.registerAdmin = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const adminExist = await Admin.findOne({ email });
    if (adminExist) return res.status(400).json({ message: "Admin already exists" });

    const admin = await Admin.create({ name, email, password });
    res.status(201).json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      token: generateToken(admin._id, admin.role),
    });
  } catch (err) {
    next(err);
  }
};

//* forgotPassword fully understand - STATUS(200)
// Forgot Password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    let account = await User.findOne({ email });
    if (!account) {
      account = await Recruiter.findOne({ email });
    }
    if (!account) {
      account = await TeamMember.findOne({ email });
    }
    if (!account) {
      account = await Admin.findOne({ email });
    }

    if (!account) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = generateEmailToken(account._id);
    // Link for HashRouter frontend
    const resetUrl = `${process.env.CLIENT_URL}/#/reset-password/${token}`;

    try {
      await sendEmail({
        to: account.email,
        template: "forgot_password",
        variables: {
          name: account.name,
          link: resetUrl,
        },
      });
    } catch (emailError) {
      console.error("Failed to send forgot password email:", emailError);
      if (emailError.message.includes("Template")) {
        return res.status(500).json({ message: "Email template configuration error." });
      }
      return res.status(500).json({
        message: `Failed to send email: ${emailError.message}`,
        details: emailError.response ? emailError.response.body : "No additional details"
      });
    }

    res.status(200).json({
      success: true,
      message: "Password reset link sent to your email",
    });
  } catch (err) {
    next(err);
  }
};

// Reset Password
exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params; // Token is in the URL path for this route structure
    console.log("token in resetPassword: ", token);
    const { password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: "Token and password are required" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("decoded in resetPassword: ", decoded);
    } catch (e) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Step 1: If user is null, then find in Recruiter collection
    let account;
    account = await User.findById(decoded.requestId); // generateEmailToken uses 'requestId' as payload key
    if (account === null) account = await Recruiter.findById(decoded.requestId);
    if (!account) {
      return res.status(404).json({ message: "User and Recruiter does not found" });
    }

    account.password = password; // Pre-save hook in User model should hash this
    await account.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (err) {
    next(err);
  }
};
