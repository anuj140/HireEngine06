const mongoose = require("mongoose");
const TeamMember = require("../models/TeamMember");
const BadRequestError = require("../errors/bad-request");
const ForbiddenError = require("../errors/forbidden-error");
const NotFoundError = require("../errors/not-found");
const Job = require("../models/Job");
const sendEmail = require("../utils/sendEmail");

// HR Manager posts job (requires approval)
exports.createJobForApproval = async (req, res, next) => {
  try {
    const {
      title,
      position,
      companyName,
      companyDescription,
      companySocial,
      jobType,
      workMode, // Added workMode
      earningPotential,
      fixedEarnings,
      experienceLevel,
      jobHighlights,
      description,
      requirements,
      skills,
      experience,
      education,
      gender,
      salary,
      location,
      questions,
      // Extras from frontend form
      openings,
      educationalQualification,
      applicationDeadline,
      industry,
      department,
      perksAndBenefits,
      shiftTimings,
      noticePeriodPreference,
      preferredCandidateLocation,
      hiringType,
      applicationInstructions,
      interviewProcessInfo,
    } = req.body;

    const postedBy = req.user.id;
    const isTeamMember = req.user.role === "team_member";

    // Determine the main recruiter ID for subscription check
    const mainRecruiterId = isTeamMember ? req.user.recruiterId : postedBy;

    // Validate HR Manager permissions
    if (isTeamMember && !req.user.permissions.canManageJobs) {
      throw new ForbiddenError("You don't have permission to post jobs");
    }

    // ---- Subscription Check ----
    const {
      checkJobCreationLimits,
      incrementJobCounter,
    } = require("../utils/subscriptionHelper");
    const subscription = await checkJobCreationLimits(mainRecruiterId, req.body);
    console.log("checkJobCreationLimits: ", checkJobCreationLimits);

    // Format questions (max 5)
    let formattedQuestions = [];
    if (questions && Array.isArray(questions)) {
      if (questions.length > 5) {
        throw new BadRequestError("Max 5 questions allowed");
      }
      formattedQuestions = questions.map((q) => ({
        question: q.question,
        type: q.type === "boolean" ? "boolean" : "text",
      }));
    }

    const numericSalary = Number(String(salary || "0").replace(/,/g, ""));

    const jobPayload = {
      title,
      position,
      companyName,
      companyDescription,
      companySocial,
      jobType,
      workMode, // Added workMode
      earningPotential,
      fixedEarnings,
      experienceLevel,
      jobHighlights: Array.isArray(jobHighlights)
        ? jobHighlights
        : jobHighlights
        ? jobHighlights
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s !== "")
        : [],
      description,
      requirements: Array.isArray(requirements)
        ? requirements
        : requirements
        ? requirements.split(",").map((s) => s.trim())
        : [],
      skills: Array.isArray(skills)
        ? skills
        : skills
        ? skills.split(",").map((s) => s.trim())
        : [],
      experience,
      education,
      gender,
      salary: isNaN(numericSalary) ? undefined : numericSalary, // Safely parse salary
      location,
      questions: formattedQuestions,
      approvalStatus: "pending",
      visibility: false, // Not visible until approved
      status: "paused", // Paused until approved
      // Extras from frontend
      openings,
      educationalQualification,
      applicationDeadline,
      //! Add expiry date of job post based on subscription plan
      expiryDate: applicationDeadline
        ? new Date(applicationDeadline)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days if missing
      industry,
      department,
      perksAndBenefits: Array.isArray(perksAndBenefits)
        ? perksAndBenefits
        : perksAndBenefits
        ? perksAndBenefits.split(",").map((s) => s.trim())
        : [],
      shiftTimings,
      noticePeriodPreference,
      preferredCandidateLocation,
      hiringType,
      applicationInstructions,
      interviewProcessInfo,
      maxApplicants: req.body.maxApplicants, // Set by checkJobCreationLimits
    };

    // Set posted by information based on user type
    if (isTeamMember) {
      jobPayload.postedByUser = postedBy;
      jobPayload.postedByModel = "TeamMember";
      jobPayload.postedByName = req.user.name;
      if (!req.user.recruiterId) {
        throw new Error("Recruiter link missing for team member");
      }
      jobPayload.postedBy = req.user.recruiterId;
      jobPayload.company = req.user.recruiterId; // Set company
    } else {
      jobPayload.postedBy = postedBy;
      jobPayload.company = postedBy; // Set company
      jobPayload.postedByModel = "Recruiter";
      jobPayload.postedByName = req.user.name;
    }

    const job = await Job.create(jobPayload);

    // ---- Increment Subscription Counter ----
    await incrementJobCounter(subscription);
    // ----------------------------------------

    // If posted by main recruiter, auto-approve
    if (!isTeamMember) {
      job.approvalStatus = "approved";
      job.approvedBy = postedBy;
      job.approvedAt = new Date();
      job.visibility = true;
      job.status = "active";
      await job.save();
    }

    res.status(201).json({
      success: true,
      message: isTeamMember
        ? "Job posted successfully and sent for approval"
        : "Job posted and approved successfully",
      job: {
        _id: job._id,
        title: job.title,
        position: job.position,
        approvalStatus: job.approvalStatus,
        postedByName: job.postedByName,
        createdAt: job.createdAt,
      },
      postingStats: {
        limit: subscription.plan.features.maxActiveJobs,
        used: subscription.usage.activeJobs, // It was incremented
        remaining:
          subscription.plan.features.maxActiveJobs === null
            ? null
            : Math.max(
                0,
                subscription.plan.features.maxActiveJobs - subscription.usage.activeJobs
              ),
      },
    });
  } catch (err) {
    next(err);
  }
};

// Get pending jobs for approval (Recruiter only)
exports.getPendingJobs = async (req, res, next) => {
  try {
    const recruiterId = req.user.id;

    const pendingJobs = await Job.find({
      postedBy: recruiterId,
      approvalStatus: "pending",
    })
      .populate("postedByUser", "name email role")
      .select("-requirements -description")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: pendingJobs.length,
      pendingJobs: pendingJobs.map((job) => ({
        id: job._id,
        title: job.title,
        position: job.position,
        location: job.location,
        jobType: job.jobType,
        experienceLevel: job.experienceLevel,
        salary: job.salary,
        postedByName: job.postedByName,
        postedByUser: job.postedByUser,
        createdAt: job.createdAt,
        skills: job.skills,
      })),
    });
  } catch (err) {
    next(err);
  }
};

// Get job details for approval decision
exports.getJobForApproval = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const recruiterId = req.user.id;

    const job = await Job.findOne({
      _id: jobId,
      postedBy: recruiterId,
    }).populate("postedByUser", "name email role");

    if (!job) {
      throw new NotFoundError("Job not found");
    }

    res.status(200).json({
      success: true,
      job: {
        id: job._id,
        title: job.title,
        position: job.position,
        companyName: job.companyName,
        companyDescription: job.companyDescription,
        jobType: job.jobType,
        earningPotential: job.earningPotential,
        fixedEarnings: job.fixedEarnings,
        experienceLevel: job.experienceLevel,
        jobHighlights: job.jobHighlights,
        description: job.description,
        requirements: job.requirements,
        skills: job.skills,
        experience: job.experience,
        education: job.education,
        gender: job.gender,
        salary: job.salary,
        location: job.location,
        questions: job.questions,
        postedByName: job.postedByName,
        postedByUser: job.postedByUser,
        approvalStatus: job.approvalStatus,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Approve job (Recruiter only)
exports.approveJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const recruiterId = req.user.id;

    const job = await Job.findOne({
      _id: jobId,
      postedBy: recruiterId,
      approvalStatus: "pending",
    }).populate("postedByUser", "name email");

    if (!job) {
      throw new NotFoundError("Pending job not found");
    }

    job.approvalStatus = "approved";
    job.approvedBy = recruiterId;
    job.approvedAt = new Date();
    job.visibility = true;
    job.status = "active";
    await job.save();

    // Send notification to HR Manager if job was posted by team member
    if (job.postedByUser) {
      await sendEmail({
        to: job.postedByUser.email,
        template: "job_approved",
        variables: {
          name: job.postedByUser.name,
          jobTitle: job.title,
          jobLink: `${process.env.CLIENT_URL}/jobs/${job._id}`,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: "Job approved successfully",
      job: {
        id: job._id,
        title: job.title,
        approvalStatus: job.approvalStatus,
        approvedAt: job.approvedAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Reject job (Recruiter only)
exports.rejectJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { rejectionReason } = req.body;
    const recruiterId = req.user.id;

    if (!rejectionReason || rejectionReason.trim().length < 10) {
      throw new BadRequestError("Rejection reason must be at least 10 characters long");
    }

    const job = await Job.findOne({
      _id: jobId,
      postedBy: recruiterId,
      approvalStatus: "pending",
    }).populate("postedByUser", "name email");

    if (!job) {
      throw new NotFoundError("Pending job not found");
    }

    job.approvalStatus = "rejected";
    job.rejectionReason = rejectionReason.trim();
    job.visibility = false;
    job.status = "closed";
    await job.save();

    // Send notification to HR Manager
    if (job.postedByUser) {
      await sendEmail({
        to: job.postedByUser.email,
        template: "job_rejected",
        variables: {
          name: job.postedByUser.name,
          jobTitle: job.title,
          rejectionReason: job.rejectionReason,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: "Job rejected successfully",
      job: {
        id: job._id,
        title: job.title,
        approvalStatus: job.approvalStatus,
        rejectionReason: job.rejectionReason,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Get job approval statistics
exports.getApprovalStats = async (req, res, next) => {
  try {
    const recruiterId = req.user.id;

    const stats = await Job.aggregate([
      {
        $match: {
          postedBy: mongoose.Types.ObjectId(recruiterId),
          postedByModel: "TeamMember", // Only team member posted jobs
        },
      },
      {
        $group: {
          _id: "$approvalStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    const formattedStats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: 0,
    };

    stats.forEach((stat) => {
      formattedStats[stat._id] = stat.count;
      formattedStats.total += stat.count;
    });

    res.status(200).json({
      success: true,
      stats: formattedStats,
    });
  } catch (err) {
    next(err);
  }
};

// HR Manager gets their job posts with status
exports.getMyJobPosts = async (req, res, next) => {
  try {
    const teamMemberId = req.user.id;

    const jobs = await Job.find({
      postedByUser: teamMemberId,
      postedByModel: "TeamMember",
    })
      .select("title position approvalStatus rejectionReason createdAt updatedAt")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: jobs.length,
      jobs,
    });
  } catch (err) {
    next(err);
  }
};

// ✅ Get all pending jobs for review by main recruiter
exports.getPendingJobsForRecruiter = async (req, res) => {
  try {
    const recruiterId = req.user.id; // authenticated main recruiter

    // Find all team members under this recruiter
    const teamMembers = await TeamMember.find({ recruiterId: recruiterId });

    const teamMemberIds = teamMembers.map((member) => member._id);

    // Fetch jobs posted by those team members that are still pending
    const pendingJobs = await Job.find({
      postedByModel: "TeamMember",
      postedByUser: { $in: teamMemberIds },
      approvalStatus: "pending",
    })
      .populate({
        path: "postedByUser",
        select: "name email role",
      })
      .sort({ createdAt: -1 }) // newest first
      .select("position jobDescription skills createdAt approvalStatus");

    res.status(200).json({
      success: true,
      count: pendingJobs.length,
      jobs: pendingJobs.map((job) => ({
        id: job._id,
        position: job.position,
        postedBy: job.postedByUser?.fullName || "Unknown",
        postedByEmail: job.postedByUser?.email || "",
        postedOn: job.createdAt,
        description: job.jobDescription,
        skills: job.skills,
        approvalStatus: job.approvalStatus,
      })),
    });
  } catch (error) {
    console.error("Error fetching pending jobs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending jobs for review",
      error: error.message,
    });
  }
};
