const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const twilio = require("twilio");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/User");
const Job = require("../models/Job");
const Notification = require("../models/Notification");
const Application = require("../models/Application");
const BadRequestError = require("../errors/bad-request");
const NotFoundError = require("../errors/not-found");
const generateEmailToken = require("../utils/genrateEmailToken");
const sendEmail = require("../utils/sendEmail");
const {
  createNewApplicationNotification,
  createApplicationWithdrawalNotification,
} = require("./recruiterNotificationController");

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Apply Job with notification
exports.applyJob = async (req, res, next) => {
  try {
    const { jobId, answers } = req.body;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      throw new BadRequestError("Invalid Job ID format");
    }

    // Fetch all required documents concurrently
    const [job, user, applicationExist] = await Promise.all([
      Job.findById(jobId),
      User.findById(userId),
      Application.findOne({ job: jobId, applicant: userId }),
    ]);

    if (!job || job.status !== "active") {
      throw new NotFoundError("Job not found or is no longer active");
    }
    if (!user) {
      throw new NotFoundError("Applicant user profile not found");
    }
    if (applicationExist) {
      throw new BadRequestError("You have already applied for this job");
    }

    // Compatibility fix: Map old recruiterQuestions to new questions format if needed
    if (
      (!job.questions || job.questions.length === 0) &&
      job.recruiterQuestions &&
      job.recruiterQuestions.length > 0
    ) {
      job.questions = job.recruiterQuestions.map((q) => ({
        question: q,
        type: "text",
      }));
    }

    let answersForDb = [];
    if (job.questions && job.questions.length > 0) {
      if (
        !answers ||
        !Array.isArray(answers) ||
        answers.length !== job.questions.length
      ) {
        throw new BadRequestError("All recruiter questions must be answered.");
      }
      answersForDb = job.questions.map((q, index) => {
        const userAnswer = answers[index];
        if (
          !userAnswer ||
          typeof userAnswer !== "object" ||
          userAnswer.question !== q.question
        ) {
          throw new BadRequestError(
            `Data for question #${index + 1} is missing or malformed.`
          );
        }
        if (q.type === "boolean" && typeof userAnswer.answer !== "boolean") {
          throw new BadRequestError(`Answer for "${q.question}" must be true/false`);
        }
        if (q.type === "text" && typeof userAnswer.answer !== "string") {
          throw new BadRequestError(`Answer for "${q.question}" must be text`);
        }
        return {
          question: q.question,
          type: q.type,
          answer: userAnswer.answer,
        };
      });
    }

    // Create application with answers
    const application = await Application.create({
      job: jobId,
      applicant: userId,
      answers: answersForDb,
    });

    // Atomic Updates using findByIdAndUpdate
    // This prevents race conditions where saving the document version fails
    await Promise.all([
      // Add to User's applied jobs
      User.findByIdAndUpdate(userId, {
        $addToSet: { appliedJobs: { job: jobId, status: "applied" } },
      }),
      // Add to Job's applicants list
      Job.findByIdAndUpdate(jobId, {
        $addToSet: { applicants: application._id },
      }),
    ]);

    // Create notification for successful application
    await Notification.create({
      user: userId,
      type: "application_status_change",
      title: "Application Submitted",
      message: `Your application for "${job.title}" at ${
        job.companyName || "the company"
      } has been successfully submitted.`,
      data: {
        jobId: job._id,
        applicationId: application._id,
        jobTitle: job.title,
        companyName: job.companyName || job.company?.companyName || "Company",
      },
      priority: "low", // Informational notification
    });

    createNewApplicationNotification(
      job.company,
      job._id,
      application._id,
      application.applicant.name,
      job.title
    );

    return res.status(201).json({
      success: true,
      msg: `Successfully applied for ${job.title}!`,
      application: application,
    });
  } catch (err) {
    next(err);
  }
};

// Withdraw Application
exports.withdrawApplication = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      throw new BadRequestError("Invalid Job ID format");
    }

    // Find the application and populate necessary job fields
    const application = await Application.findOne({ 
      job: jobId, 
      applicant: userId 
    }).populate({
      path: 'job',
      select: 'company title', // Only populate necessary fields
    });

    if (!application) {
      throw new NotFoundError("Application not found");
    }

    // Prevent withdrawing if status is Hired or Rejected (optional business rule)
    // if (['Hired', 'Rejected'].includes(application.status)) {
    //     throw new BadRequestError("Cannot withdraw application at this stage.");
    // }

    // Delete the application document
    await Application.findByIdAndDelete(application._id);

    // Atomic Updates to remove references
    await Promise.all([
      // Remove from User's applied jobs
      User.findByIdAndUpdate(userId, {
        $pull: { appliedJobs: { job: jobId } },
      }),
      // Remove from Job's applicants list
      Job.findByIdAndUpdate(jobId, {
        $pull: { applicants: application._id },
      }),
    ]);

    // Get the job's company ID separately
    const job = await Job.findById(jobId).select('company');
    
    // Get user details for notification
    const user = await User.findById(userId).select('name');
    
    // Create notification with proper data
    if (job && user) {
      createApplicationWithdrawalNotification(
        job.company, // Now this will be the actual company ID
        application.job._id, // Use the job ID from the application
        user.name, // Use the user's name
        application.job.title // Use the job title from populated application
      );
    }

    return res.status(200).json({
      success: true,
      message: "Application withdrawn successfully",
    });
  } catch (err) {
    next(err);
  }
};

// Bookmark job
exports.bookmarkJob = async (req, res) => {
  const { jobId } = req.body;
  const userId = req.user.id;

  const updateResult = await User.updateOne(
    { _id: userId, "bookmarks.job": { $ne: jobId } },
    { $push: { bookmarks: { job: jobId, savedAt: new Date() } } }
  );

  if (updateResult.modifiedCount > 0 || updateResult.matchedCount > 0) {
    res.status(200).json({ success: true, message: "Job bookmarked successfully" });
  } else {
    // This case might not be hit if the job is already there due to the $ne query,
    // but it's good practice.
    res.status(200).json({ success: true, message: "Job already bookmarked" });
  }
};

// Get all bookmarked jobs
exports.getAllBookmarks = async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.findById(userId)
      .populate({
        path: "bookmarks.job",
        populate: {
          path: "postedBy",
          model: "Recruiter",
          select: "companyName logo rating reviews",
        },
      })
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const formattedBookmarks = user.bookmarks
      .map((bookmark) => {
        if (!bookmark.job) return null;

        const job = bookmark.job;
        const { _id, postedBy, ...rest } = job;

        const company = postedBy
          ? {
              id: postedBy._id.toString(),
              name: postedBy.companyName,
              logoUrl: postedBy.logo,
              description: postedBy.shortDescription || postedBy.aboutUs || "",
              rating: postedBy.rating || 4.0,
              reviews: postedBy.reviews || 0,
            }
          : {
              id: "unknown",
              name: job.companyName || "Confidential",
              logoUrl: "https://via.placeholder.com/150",
              description: "",
              rating: 0,
              reviews: 0,
            };

        return {
          ...rest,
          id: _id.toString(),
          company,
          savedAt: bookmark.savedAt, // Add the saved date
          postedDate: new Date(job.createdAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
        };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));

    res.status(200).json({
      success: true,
      count: formattedBookmarks.length,
      bookmarks: formattedBookmarks,
    });
  } catch (err) {
    console.error("getAllBookmarks error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch bookmarks" });
  }
};

// Delete a bookmarked job
exports.deleteBookmark = async (req, res) => {
  const { jobId } = req.params;
  const userId = req.user.id;

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { bookmarks: { job: jobId } } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "Bookmark removed successfully",
    });
  } catch (err) {
    console.error("deleteBookmark error:", err);
    res.status(500).json({ success: false, message: "Failed to delete bookmark" });
  }
};

// Get logged-in user profile
exports.getUserProfile = async (req, res) => {
  const user = await User.findById(req.user.id)
    .select("-password") // never return password hash
    .populate("bookmarks.job", "title position companyName jobType") // optional: include bookmarked jobs
    .populate("appliedJobs.job", "title position companyName jobType"); // optional: include applied jobs

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Count recruiter actions (applications where status is NOT 'new')
  // 'new' matches the default status in Application model.
  const recruiterActionsCount = await Application.countDocuments({
    applicant: req.user.id,
    status: { $ne: "new" },
  });

  const userObj = user.toObject();
  // Ensure profile object exists to attach the count
  if (!userObj.profile) userObj.profile = {};
  userObj.profile.recruiterActionsCount = recruiterActionsCount;

  res.status(200).json({
    success: true,
    user: userObj,
  });
};

// Update user profile
exports.updateProfile = async (req, res, next) => {
  const updates = req.body;
  const userId = req.user.id;

  try {
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Handle top-level user fields like name and phone
    if (updates.name) {
      user.name = updates.name;
    }
    if (updates.phone) {
      user.phone = updates.phone;
    }

    // Handle nested profile fields from updates.profile
    if (updates.profile) {
      if (!user.profile) {
        user.profile = {}; // Initialize if it doesn't exist
      }
      // Use Mongoose's .set() for safe deep merging
      for (const key in updates.profile) {
        // This will set user.profile.careerProfile, user.profile.headline etc. correctly
        user.set(`profile.${key}`, updates.profile[key]);
      }
    }

    // Recalculate profile completion
    // toObject() gets a plain object version, including any changes we just .set()
    const profile = user.profile.toObject();
    let completion = 0;
    if (profile.headline) completion += 5;
    if (profile.profileSummary) completion += 10;
    if (profile.resumeUrl && profile.resumeUrl.length > 0) completion += 15;
    if (profile.skills && profile.skills.length > 0) completion += 10;
    if (profile.employment && profile.employment.length > 0) completion += 20;
    if (profile.education && profile.education.length > 0) completion += 15;
    // Correctly reference phone from the top-level user object
    if (profile.location && user.phone) completion += 5;
    if (
      profile.accomplishments &&
      (profile.accomplishments.certifications?.length > 0 ||
        profile.accomplishments.onlineProfiles?.length > 0)
    )
      completion += 10;
    if (profile.careerProfile && profile.careerProfile.currentIndustry) completion += 5;
    if (user.profilePhoto) completion += 5;

    user.profile.profileCompletion = Math.min(completion, 100);

    await user.save();

    // Get recruiter actions count again to keep UI in sync
    const recruiterActionsCount = await Application.countDocuments({
      applicant: userId,
      status: { $ne: "new" },
    });

    const userToReturn = user.toObject();
    delete userToReturn.password;
    if (!userToReturn.profile) userToReturn.profile = {};
    userToReturn.profile.recruiterActionsCount = recruiterActionsCount;

    res.json(userToReturn);
  } catch (err) {
    // Pass to the centralized error handler for a cleaner response
    next(err);
  }
};

exports.verifyNewPhone = async (req, res) => {
  const userId = req.user.id;
  const { otp } = req.body;

  const user = await User.findById(userId);
  if (!user || !user.pendingPhone) {
    return res.status(400).json({ message: "No pending phone update found" });
  }

  try {
    const verification_check = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({ to: user.pendingPhone, code: otp });

    if (verification_check.status === "approved") {
      user.phone = user.pendingPhone;
      user.phoneVerified = true;
      user.pendingPhone = null;
      await user.save();

      return res.status(200).json({
        success: true,
        message: "Phone number updated and verified successfully",
        phone: user.phone,
      });
    } else {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }
  } catch (err) {
    console.error("verifyNewPhone error:", err);
    res.status(500).json({ message: "Failed to verify phone number" });
  }
};

// Send verification email
exports.sendUserEmailVerification = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const token = generateEmailToken(user._id);
    const verifyUrl = `${process.env.CLIENT_URL}/verify-user-email?token=${token}`;

    await sendEmail({
      to: user.email,
      template: "user_email_verification", // template name stored in DB
      variables: {
        name: user.name,
        link: verifyUrl,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Verification email sent. Please check your inbox.",
    });
  } catch (err) {
    next(err);
  }
};

// Verify email (via link)
exports.verifyUserEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ success: false, message: "Token required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.emailVerified = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully!",
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

// Upload Profile Photo
exports.uploadProfilePhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new BadRequestError("No file uploaded");
    }

    if (!req.file.path) {
      throw new Error("File upload failed, path not available");
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePhoto: req.file.path },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Profile photo uploaded successfully",
      profilePhoto: user.profilePhoto,
    });
  } catch (err) {
    next(err);
  }
};

// Upload Resume
exports.uploadResume = async (req, res, next) => {
  try {
    if (!req.file || !req.file.path) {
      throw new BadRequestError("No resume file uploaded");
    }

    const user = await User.findById(req.user.id);
    user.profile.resumeUrl = req.file.path;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Resume uploaded successfully",
      resumeUrl: user.profile.resumeUrl,
    });
  } catch (err) {
    next(err);
  }
};

// Delete profile photo
exports.deleteProfilePhoto = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.profilePhoto) {
      throw new NotFoundError("No profile photo found");
    }

    const publicIdWithFolder = user.profilePhoto
      .split("/")
      .slice(-2)
      .join("/")
      .split(".")[0];
    await cloudinary.uploader.destroy(publicIdWithFolder);

    user.profilePhoto = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile photo deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

// Delete resume
exports.deleteResume = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.profile.resumeUrl) {
      throw new NotFoundError("No resume found");
    }

    const publicIdWithFolder = user.profile.resumeUrl
      .split("/")
      .slice(-2)
      .join("/")
      .split(".")[0];
    await cloudinary.uploader.destroy(publicIdWithFolder, {
      resource_type: "raw",
    });

    user.profile.resumeUrl = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Resume deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

// Get all applied jobs with details
exports.getAppliedJobs = async (req, res, next) => {
  try {
    const applications = await Application.find({ applicant: req.user.id })
      .populate({
        path: "job",
        select: "title",
        populate: {
          path: "postedBy",
          model: "Recruiter",
          select: "companyName",
        },
      })
      .sort({ appliedAt: -1 }); // Sort by appliedAt descending

    const statusMap = {
      new: "Applied",
      reviewed: "Viewed",
      shortlisted: "Shortlisted",
      interview: "Interview Scheduled",
      scheduled: "Interview Scheduled",
      hired: "Hired",
      rejected: "Rejected",
    };

    const formattedApplications = applications
      .map((app) => {
        if (!app.job || !app.job.postedBy) return null;
        return {
          jobId: app.job._id,
          jobTitle: app.job.title,
          companyName: app.job.postedBy.companyName,
          status: statusMap[app.status] || app.status,
          appliedDate: app.appliedAt, // Correct field name
        };
      })
      .filter(Boolean);

    res.status(200).json({ success: true, applications: formattedApplications });
  } catch (err) {
    next(err);
  }
};
