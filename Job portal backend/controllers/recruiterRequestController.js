const mongoose = require("mongoose");
const RecruiterRequest = require("../models/RecruiterRequest");
const twilio = require("twilio");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail"); // utility that sends templated emails
require("dotenv").config();
// Custom error classes (project‑specific)
const BadRequestError = require("../errors/bad-request");
const NotFoundError = require("../errors/not-found");

// Twilio client – will be used for OTP verification
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Generate a JWT token used for email verification links
const generateRecruiterEmailToken = (requestId) => {
  return jwt.sign(
    {
      requestId,
      type: "recruiter_email_verification",
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};

// ------------------------------------------------------------
// 1️⃣ Recruiter creates a registration request
exports.createRecruiterRequest = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      companyName,
      companyType,
      companyWebsite,
      CIN,
      LLPIN,
      GSTIN,
      ownerPAN,
      companyPAN,
      udyamRegNo,
      documents,
    } = req.body;

    // ----- Validation based on company type -----
    if (["pvt_ltd", "llp", "partnership"].includes(companyType)) {
      // Domain‑based email required
      if (/@(gmail|yahoo|outlook|hotmail)\.com$/i.test(email)) {
        throw new BadRequestError("Company email (domain‑based) required");
      }
      if (companyType === "pvt_ltd") {
        if (!CIN) throw new BadRequestError("CIN is required for Pvt Ltd");
        if (!companyPAN) throw new BadRequestError("Company PAN is required for Pvt Ltd");
      }
      if (companyType === "llp") {
        if (!LLPIN) throw new BadRequestError("LLPIN is required for LLP");
        if (!companyPAN) throw new BadRequestError("Company PAN is required for LLP");
      }
      if (companyType === "partnership") {
        if (!ownerPAN && !companyPAN)
          throw new BadRequestError("Firm PAN or Partner PAN is required");
      }
    }

    if (["startup", "proprietorship"].includes(companyType)) {
      if (!ownerPAN) throw new BadRequestError("Owner PAN is required");
      if (!udyamRegNo && !GSTIN)
        throw new BadRequestError("Provide Udyam/MSME certificate or GSTIN");
    }

    // ----- Upsert pending request -----
    let request = await RecruiterRequest.findOne({
      $or: [{ email }, { phone }],
    });
    if (request) {
      if (request.status !== "pending") {
        throw new BadRequestError("Account already registered and processed");
      }
      // Update pending request fields
      request.name = name;
      request.password = password; // pre‑save hook will hash it
      request.companyName = companyName;
      request.companyType = companyType;
      request.companyWebsite = companyWebsite;
      request.CIN = CIN;
      request.LLPIN = LLPIN;
      request.GSTIN = GSTIN;
      request.ownerPAN = ownerPAN;
      request.companyPAN = companyPAN;
      request.udyamRegNo = udyamRegNo;
      if (documents) request.documents = documents;
      await request.save();
    } else {
      request = await RecruiterRequest.create({
        name,
        email,
        phone,
        password,
        companyName,
        companyType,
        companyWebsite,
        CIN,
        LLPIN,
        GSTIN,
        ownerPAN,
        companyPAN,
        udyamRegNo,
        documents,
      });
    }

    console.log("phone: ", phone);

    // // ----- Auto‑send verification email -----
    // try {
    //   const token = generateRecruiterEmailToken(request._id);
    //   const verifyUrl = `${process.env.CLIENT_URL}/verify-recruiter-email?token=${token}`;
    //   await sendEmail({
    //     to: email,
    //     template: "recruiter_email_verification",
    //     variables: { name, link: verifyUrl },
    //   });
    //   console.log(`✅ Auto‑verification email sent to ${email}`);
    // } catch (emailErr) {
    //   console.error("⚠️ Failed to send auto‑verification email:", emailErr.message);
    // }

    return res.status(201).json({
      success: true,
      message: "Recruiter request submitted.",
      requestId: request._id,
    });
  } catch (err) {
    next(err);
  }
};

// ------------------------------------------------------------
// 2️⃣ Send OTP to the recruiter’s phone number
exports.sendRecruiterPhoneOtp = async (req, res, next) => {
  try {
    const { requestId, phone } = req.body;

    if (!requestId || !phone) throw new BadRequestError("requestId and phone required");

    const request = await RecruiterRequest.findById(requestId);
    if (!request) throw new NotFoundError("Recruiter request not found");

    // Verify the phone matches the stored one (both are plain digits)
    if (request.phone !== phone) {
      throw new BadRequestError("Phone does not match request record");
    }

    await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({ to: phone, channel: "sms" });

    return res.status(200).json({ success: true, message: "OTP sent to phone" });
  } catch (err) {
    console.error("❌ Error in sendRecruiterPhoneOtp:", err);
    next(err);
  }
};

// ------------------------------------------------------------
// 3️⃣ Verify the OTP entered by the recruiter
exports.verifyRecruiterPhoneOtp = async (req, res, next) => {
  console.log("called verifyRecruiterPhoneOtp function ");
  try {
    const { requestId, phone, otp } = req.body;
    if (!requestId || !phone || !otp)
      throw new BadRequestError("requestId, phone, and otp required");

    const request = await RecruiterRequest.findById(requestId);
    if (!request) throw new Error("Recruiter request not found");

    if (request.phone !== phone) {
      throw new BadRequestError("Phone does not match request record");
    }

    const check = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({ to: phone, code: otp });

    if (check.status === "approved") {
      request.phoneVerified = true;
      await request.save();
      return res.status(200).json({ success: true, message: "Phone verified" });
    }

    return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
  } catch (err) {
    next(err);
  }
};

// 4️⃣ Resend verification email (if needed)
exports.sendRecruiterEmailVerification = async (req, res, next) => {
  try {
    const { requestId, email } = req.body;
    if (!requestId || !email) {
      return res
        .status(400)
        .json({ success: false, message: "requestId and email are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid request ID format" });
    }

    const request = await RecruiterRequest.findById(requestId);
    if (!request) {
      return res
        .status(404)
        .json({ success: false, message: "Recruiter request not found" });
    }

    if (request.email !== email) {
      return res.status(400).json({
        success: false,
        message: "Email does not match recruiter request record",
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Recruiter request has already been ${request.status}`,
      });
    }

    const token = generateRecruiterEmailToken(requestId);
    const verifyUrl = `${process.env.CLIENT_URL}/verify-recruiter-email?token=${token}`;
    await sendEmail({
      to: email,
      template: "recruiter_email_verification",
      variables: { name: request.name, link: verifyUrl },
    });

    return res
      .status(200)
      .json({ success: true, message: "Verification email sent successfully" });
  } catch (err) {
    console.error("sendRecruiterEmailVerification error:", err);
    if (err.name === "MongoError" || err.name === "MongoServerError") {
      return res.status(500).json({ success: false, message: "Database error occurred" });
    }
    next(err);
  }
};

// ------------------------------------------------------------
// 5️⃣ Verify email link (called from front‑end after user clicks the link)
exports.verifyRecruiterEmail = async (req, res, next) => {
  console.log("verifyRecruiterEmail is called");
  try {
    const { token } = req.query;
    if (!token) throw new BadRequestError("Verification token required");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const request = await RecruiterRequest.findById(decoded.requestId);
    if (!request) throw new NotFoundError("Recruiter request not found");

    request.emailVerified = true;
    await request.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully. You may now wait for admin approval.",
    });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res
        .status(400)
        .json({ success: false, message: "Verification link expired" });
    }
    next(err);
  }
};

// ------------------------------------------------------------
// 6️⃣ Upload recruiter documents (used later in the flow)
exports.uploadRecruiterDocuments = async (req, res, next) => {
  try {
    const { requestId } = req.body;
    if (!requestId) throw new BadRequestError("requestId is required");

    const request = await RecruiterRequest.findById(requestId);
    if (!request) throw new NotFoundError("Recruiter request not found");

    if (!req.files || req.files.length === 0) {
      throw new BadRequestError("No documents uploaded");
    }

    const fileUrls = req.files.map((file) => file.path);

    // Validation based on company type (same rules as before)
    if (["pvt_ltd", "llp", "partnership"].includes(request.companyType)) {
      if (!request.CIN && !request.LLPIN) {
        throw new BadRequestError("CIN or LLPIN is required for registered companies");
      }
      if (!request.GSTIN) {
        throw new BadRequestError("GSTIN is required for registered companies");
      }
      if (/@(gmail|yahoo|outlook|hotmail)\.com$/i.test(request.email)) {
        throw new BadRequestError(
          "Official domain email is required for registered companies"
        );
      }
      if (fileUrls.length < 2) {
        throw new BadRequestError(
          "Registered companies must upload CIN/LLPIN proof and GSTIN certificate"
        );
      }
    }

    if (["startup", "proprietorship"].includes(request.companyType)) {
      if (!request.ownerPAN) {
        throw new BadRequestError("Owner PAN is required for startups/proprietorships");
      }
      if (!request.udyamRegNo && !request.GSTIN) {
        throw new BadRequestError("Either Udyam/MSME certificate or GSTIN is required");
      }
      if (fileUrls.length < 2) {
        throw new BadRequestError(
          "Startups/Proprietorships must upload PAN card and Udyam/MSME certificate or GSTIN"
        );
      }
    }

    // Save documents
    request.documents = [...request.documents, ...fileUrls];
    await request.save();

    return res.status(200).json({
      success: true,
      message: "Documents uploaded successfully",
      documents: request.documents,
    });
  } catch (err) {
    next(err);
  }
};

// ------------------------------------------------------------
// 7️⃣ Temporary helper to test SendGrid configuration (optional)
exports.testSendGrid = async (req, res) => {
  try {
    console.log("🧪 Testing SendGrid configuration...");
    console.log("API Key:", process.env.SENDGRID_API_KEY ? "Exists" : "MISSING");
    console.log("Email From:", process.env.EMAIL_FROM);

    const sgMail = require("@sendgrid/mail");
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      to: "anujkumbhar100@gmail.com",
      from: process.env.EMAIL_FROM,
      subject: "SendGrid Test",
      text: "This is a test email",
      html: "<strong>This is a test email</strong>",
    };

    const result = await sgMail.send(msg);
    res.json({
      success: true,
      message: "SendGrid test successful",
      status: result[0].statusCode,
    });
  } catch (error) {
    console.error("SendGrid Test Failed:", error);
    res.status(500).json({ success: false, error: error.message, code: error.code });
  }
};

// ------------------------------------------------------------
// End of recruiterRequestController.js
