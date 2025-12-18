const Application = require("../models/Application");
const Job = require("../models/Job");
const Recruiter = require("../models/Recruiter");
const archiver = require("archiver");
const axios = require("axios");
const sendEmail = require("../utils/sendEmail");

// --- PUBLIC COMPANY ROUTES ---

const getPublicCompanies = async (req, res) => {
  try {
    const { keywords, industry, location, companyType } = req.query;

    // FIX: Removed strict 'verificationStatus: verified' check so all active companies show up
    let query = {
      isActive: true,
    };

    // Filter by Name (Keywords)
    if (keywords) {
      query.companyName = { $regex: keywords, $options: "i" };
    }

    // Filter by Industry
    if (industry) {
      query.industry = { $regex: industry, $options: "i" };
    }

    // Filter by Company Type (MNC, Startup, etc.)
    if (companyType) {
      // The frontend might send an array or a comma-separated string
      const types = Array.isArray(companyType)
        ? companyType
        : companyType.split(",").map((t) => t.trim());

      // We search in both the explicit companyType field and the tags array
      query.$or = [
        { companyType: { $in: types.map((t) => new RegExp(t, "i")) } },
        { tags: { $in: types.map((t) => new RegExp(t, "i")) } },
      ];
    }

    // Filter by Location (Headquarters)
    if (location) {
      query.headquarters = { $regex: location, $options: "i" };
    }

    const companies = await Recruiter.find(query)
      .select(
        "companyName logoUrl description rating reviews bannerUrl companyType tags industry headquarters"
      )
      .lean();

    // Map database fields to frontend interface "Company"
    const formattedCompanies = companies.map((c) => ({
      id: c._id,
      name: c.companyName,
      logoUrl: c.logoUrl || "https://via.placeholder.com/150?text=No+Logo",
      description: c.description,
      rating: c.rating || (3 + Math.random() * 2).toFixed(1), // Fallback for demo if 0
      reviews: c.reviews || Math.floor(Math.random() * 500), // Fallback for demo if 0
      companyType: c.companyType,
      tags: c.tags,
      industry: c.industry,
      headquarters: c.headquarters,
    }));

    res.json({ success: true, companies: formattedCompanies });
  } catch (err) {
    console.error("getPublicCompanies error:", err);
    res.status(500).json({ success: false, message: "Server error fetching companies" });
  }
};

const getPublicCompanyById = async (req, res) => {
  try {
    const company = await Recruiter.findById(req.params.id).select("-password");
    // Relaxed check here too
    if (!company || !company.isActive) {
      return res.status(404).json({ msg: "Company not found or not active." });
    }

    const jobs = await Job.find({
      postedBy: req.params.id,
      status: "active",
      visibility: true,
    });

    const profile = company.toObject();

    // Map for frontend compatibility (Interface Company)
    const mappedCompany = {
      id: profile._id,
      name: profile.companyName, // Map companyName to name
      logoUrl: profile.logoUrl || "https://via.placeholder.com/150?text=No+Logo",
      bannerUrl: profile.bannerUrl,
      description: profile.description || "",
      rating: profile.rating || 4.0,
      reviews: profile.reviews || 0,
      companyType: profile.companyType,
      tags: profile.tags || [],
      tagline: profile.tagline,
      followers: profile.followers || 0,
      foundedYear: profile.foundedYear,
      companySize: profile.companySize,
      website: profile.website,
      headquarters: profile.headquarters,
      industry: profile.industry,
      overview: profile.overview || {},
      whyJoinUs: profile.whyJoinUs || {},
      // Attach jobs formatted for frontend
      jobs: jobs.map((j) => ({
        id: j._id.toString(),
        title: j.title,
        location: j.location,
        experience: j.experience,
        salary: j.salary,
        description: j.description,
        skills: j.skills,
        postedDate: new Date(j.createdAt).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        jobType: j.jobType,
        company: {
          // minimal company info needed for job card inside detail page
          id: profile._id.toString(),
          name: profile.companyName,
          logoUrl: profile.logoUrl,
          rating: profile.rating,
          reviews: profile.reviews,
        },
      })),
    };

    res.json({ success: true, company: mappedCompany });
  } catch (err) {
    console.error("getPublicCompanyById error:", err);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Company not found" });
    }
    res
      .status(500)
      .json({ success: false, message: "Server error fetching company details" });
  }
};
exports.getAllApplicants = async (req, res) => {
  try {
    const recruiterId = req.user.id;

    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filtering parameters - ALL are optional
    const {
      status,
      jobId, // This should be OPTIONAL - for filtering by specific job
      matchScoreMin,
      sortBy = "appliedAt",
      sortOrder = "desc",
    } = req.query;

    // 1. Get recruiter jobs
    const jobs = await Job.find({ postedBy: recruiterId }).select("_id title skills");
    const jobIds = jobs.map((j) => j._id);

    if (jobIds.length === 0) {
      return res.status(200).json({
        success: true,
        applicants: [],
        pagination: {
          page,
          limit,
          totalPages: 0,
          totalApplicants: 0,
          hasNext: false,
          hasPrev: false,
        },
      });
    }

    // 2. Build filter query - FIXED LOGIC
    const filter = { job: { $in: jobIds } }; // Default: ALL jobs

    if (status) filter.status = status;

    // Only apply job filter if a valid jobId is provided
    if (jobId && jobId.trim() !== "") {
      // Validate if jobId is a valid MongoDB ObjectId and belongs to recruiter
      if (mongoose.Types.ObjectId.isValid(jobId)) {
        const isValidJob = jobIds.some((id) => id.toString() === jobId);
        if (isValidJob) {
          filter.job = jobId; // Filter by specific job
        }
        // If jobId is invalid or doesn't belong to recruiter, ignore it
        // and continue with ALL jobs filter
      }
    }

    // 3. Get total count for pagination
    const totalApplicants = await Application.countDocuments(filter);

    // 4. Get paginated applications
    const applications = await Application.find(filter)
      .populate(
        "applicant",
        "name resumeUrl experience education skills expectedSalary noticePeriod"
      )
      .populate("job", "title skills createdAt")
      .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(limit);

    // 5. Build response with match score calculation
    const applicants = applications
      .map((app) => {
        if (!app.applicant || !app.job) return null;

        const user = app.applicant;

        // Experience formatting
        const exp =
          user.experience?.status === "fresher"
            ? "Fresher"
            : `${user.experience?.designation || "N/A"} @ ${
                user.experience?.company || "N/A"
              }`;

        // Match score calculation
        const jobSkills = app.job.skills || [];
        const userSkills = user.skills || [];
        const matched = userSkills.filter((s) =>
          jobSkills.map((j) => j.toLowerCase()).includes(s.toLowerCase())
        );
        const matchScore = jobSkills.length
          ? Math.round((matched.length / jobSkills.length) * 100)
          : 0;

        // Filter by match score if provided
        if (matchScoreMin && matchScore < parseInt(matchScoreMin)) {
          return null;
        }

        return {
          applicationId: app._id,
          appliedJob: {
            id: app.job._id,
            title: app.job.title,
            appliedAt: app.appliedAt,
            currentStatus: app.status,
          },
          applicant: {
            id: user._id,
            name: user.name,
            resume: user.resumeUrl,
            experience: exp,
            years: user.experience?.years || 0,
            expectedSalary: user.expectedSalary || "Not provided",
            noticePeriod: user.noticePeriod || "Not provided",
            skills: user.skills || [],
          },
          coverLetter: app.coverLetter || null,
          answers: app.answers || [],
          matchScore,
        };
      })
      .filter((applicant) => applicant !== null);

    const totalPages = Math.ceil(totalApplicants / limit);

    res.status(200).json({
      success: true,
      applicants,
      pagination: {
        page,
        limit,
        totalPages,
        totalApplicants,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      // Optional: Include available jobs for frontend filtering
      availableJobs: jobs.map((job) => ({
        id: job._id,
        title: job.title,
      })),
    });
  } catch (err) {
    console.error("getAllApplicants error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch applicants",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// Add job
const addJob = async (req, res) => {
  // whitelisted fields to avoid saving unwanted properties
  const {
    title,
    position,
    companyName,
    companyDescription,
    companySocial,
    jobType,
    workMode, // Added
    earningPotential,
    fixedEarnings,
    experienceLevel,
    jobHighlights,
    description,
    requirements,
    skills,
    experience,
    education,
    educationalQualification, // Added
    gender,
    salary,
    location,
    questions,
    applicationDeadline, // Added
    industry, // Added
    department, // Added
    perksAndBenefits, // Added
    shiftTimings, // Added
    noticePeriodPreference, // Added
    preferredCandidateLocation, // Added
    hiringType, // Added
    applicationInstructions, // Added
    interviewProcessInfo, // Added
  } = req.body;

  // validate max 5 questions
  let formattedQuestions = [];
  if (questions && Array.isArray(questions)) {
    if (questions.length > 5) {
      return res.status(400).json({ message: "Max 5 questions allowed" });
    }
    formattedQuestions = questions.map((q) => ({
      question: q.question,
      type: q.type === "boolean" ? "boolean" : "text",
    }));
  }

  const jobPayload = {
    title,
    position,
    companyName,
    companyDescription,
    companySocial,
    jobType,
    workMode, // Added
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
    educationalQualification, // Added
    gender,
    salary: salary ? Number(salary) : undefined,
    location,
    questions: formattedQuestions,
    postedBy: req.user.id,
    company: req.user.id, // Set company

    // New fields
    expiryDate: applicationDeadline
      ? new Date(applicationDeadline)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    applicationDeadline,
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
  };

  const job = await Job.create(jobPayload);

  // Update recruiter jobsPosted
  await Recruiter.findByIdAndUpdate(req.user.id, { $push: { jobsPosted: job._id } });

  res.status(201).json({ success: true, job });
};

// Change applicant status
// const changeApplicantStatus = async (req, res) => {
//   const { applicationId, status } = req.body;
//   const validStatuses = [
//     "New",
//     "Reviewed",
//     "Shortlisted",
//     "Interview Scheduled",
//     "Hired",
//     "Rejected",
//   ];
//   if (!validStatuses.includes(status)) {
//     return res.status(400).json({ success: false, message: `Invalid status. Allowed: ${validStatuses.join(', ')}` });
//   }
//   const application = await Application.findByIdAndUpdate(
//     applicationId,
//     { status },
//     { new: true }
//   );
//   res.status(200).json({ success: true, application });
// };

// New code with changeAppliantStatus with notification
const changeApplicantStatus = async (req, res) => {
  try {
    const { applicationId, status } = req.body;
    const validStatuses = [
      "New",
      "Reviewed",
      "Shortlisted",
      "Interview Scheduled",
      "Hired",
      "Rejected",
    ];

    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ID. Please provide valid ID`,
      });
    }
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed: ${validStatuses.join(", ")}`,
      });
    }

    // Get current application
    const application = await Application.findById(applicationId)
      .populate("applicant", "name email")
      .populate({
        path: "job",
        select: "title companyName",
        populate: {
          path: "company",
          select: "companyName",
        },
      });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    const oldStatus = application.status;

    // Update status
    application.status = status;
    await application.save();

    // Create notification for user
    const { createStatusChangeNotification } = require("./notificationController");

    await createStatusChangeNotification(
      application.applicant._id,
      application._id,
      oldStatus,
      status,
      application.job.title,
      application.job.companyName || application.job.company?.companyName || "Company"
    );

    // Send email notification (optional)
    if (["Shortlisted", "Interview Scheduled", "Hired", "Rejected"].includes(status)) {
      const sendEmail = require("../utils/sendEmail");

      try {
        await sendEmail({
          to: application.applicant.email,
          template: "application_status_update",
          variables: {
            name: application.applicant.name,
            jobTitle: application.job.title,
            companyName:
              application.job.companyName ||
              application.job.company?.companyName ||
              "Company",
            oldStatus,
            newStatus: status,
            applicationLink: `${process.env.FRONTEND_URL}/dashboard/applications/${application._id}`,
          },
        });
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError);
        // Don't fail the request if email fails
      }
    }

    res.status(200).json({
      success: true,
      application,
      message: `Status updated to ${status} and notification sent to applicant`,
    });
  } catch (err) {
    console.error("changeApplicantStatus error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update applicant status",
    });
  }
};

// Get recruiter analytics
const getRecruiterAnalytics = async (req, res) => {
  try {
    const recruiterId = req.user.id;

    // 1. Get recruiter’s jobs
    const jobs = await Job.find({ postedBy: recruiterId }).select("_id visibility");
    const jobIds = jobs.map((j) => j._id);

    // 2. Job counts
    const totalPostedJobs = jobs.length;
    const activeJobs = jobs.filter((j) => j.visibility).length;

    // 3. Applicant stats
    const totalApplicants = await Application.countDocuments({ job: { $in: jobIds } });
    const shortlistedApplicants = await Application.countDocuments({
      job: { $in: jobIds },
      status: "Shortlisted",
    });
    const interviewApplicants = await Application.countDocuments({
      job: { $in: jobIds },
      status: "Interview Scheduled",
    });

    // 4. Send response
    res.status(200).json({
      success: true,
      analytics: {
        totalPostedJobs,
        activeJobs,
        totalApplicants,
        shortlistedApplicants,
        interviewApplicants,
      },
    });
  } catch (err) {
    console.error("getRecruiterAnalytics error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch analytics" });
  }
};

const getAllApplicants = async (req, res, next) => {
  try {
    const companyId = req.user.company;
    if (!companyId) {
      return res.status(403).json({ msg: "User is not associated with a company." });
    }

    // 1. Get company's jobs
    const jobs = await Job.find({ company: companyId }).select("_id title skills");
    const jobIds = jobs.map((j) => j._id);

    // 2. Get applications across all jobs
    const applications = await Application.find({ job: { $in: jobIds } })
      .populate({
        path: "applicant",
        select: "name email phone profile",
      })
      .populate("job", "title skills createdAt");

    // 3. Build response
    const applicants = applications
      .map((app) => {
        if (!app.applicant || !app.applicant.profile) return null; // Safety guard

        const user = app.applicant;

        const exp =
          user.profile.workStatus === "Fresher"
            ? "Fresher"
            : `${user.profile.totalExperience?.years || 0} Years`;

        return {
          id: user._id.toString(),
          applicationId: app._id.toString(),
          jobId: app.job._id.toString(),
          jobTitle: app.job.title,
          name: user.name,
          email: user.email,
          phone: user.phone || "N/A",
          profile: {
            headline: user.profile.headline || "",
            resumeUrl: user.profile.resumeUrl || "#",
            skills: user.profile.skills || [],
          },
          experience: exp,
          qualification: user.profile.education?.[0]?.educationLevel || "N/A",
          accomplishments: [],
          applicationDate: app.appliedAt,
          status: app.status,
          answers: (app.answers || []).map((a) => a.answer),
          expectedSalary: user.profile.expectedSalary?.amount
            ? `${user.profile.expectedSalary.currency} ${user.profile.expectedSalary.amount}`
            : "Not Disclosed",
          noticePeriod: user.profile.noticePeriod || "N/A",
          location: user.profile.location || "N/A",
          coverLetter: app.coverLetter || "",
          matchScore: 0,
          notes: (app.notes || []).map(
            (n) => `${n.text} (${new Date(n.date).toISOString().split("T")[0]})`
          ),
          applicationHistory: [],
          source: "Direct",
        };
      })
      .filter(Boolean);

    res.status(200).json({ success: true, applicants });
  } catch (err) {
    next(err);
  }
};

const getApplicantsForJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { status } = req.query;
    const companyId = req.user.company;

    const job = await Job.findById(jobId).populate("questions");
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    if (job.company.toString() !== companyId.toString()) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    const filter = { job: jobId };
    if (status && status !== "all") filter.status = status;

    const applications = await Application.find(filter)
      .populate({
        path: "applicant",
        select: "name email phone profile",
      })
      .sort({ appliedAt: -1 });

    const applicants = applications
      .map((app) => {
        if (!app.applicant || !app.applicant.profile) return null;

        const u = app.applicant;
        const experience =
          u.profile.workStatus === "Fresher"
            ? "Fresher"
            : `${u.profile.totalExperience?.years || 0} years`;

        const recruiterQnA = (job.questions || []).map((q, i) => ({
          question: q.question,
          answer: app.answers?.[i]?.answer || "Not answered",
        }));

        return {
          id: u._id.toString(),
          applicationId: app._id.toString(),
          jobId: job._id.toString(),
          jobTitle: job.title,
          name: u.name,
          email: u.email,
          phone: u.phone,
          profile: {
            headline: u.profile.headline || "",
            resumeUrl: u.profile.resumeUrl || "#",
            skills: u.profile.skills || [],
          },
          experience: experience,
          qualification: u.profile.education?.[0]?.educationLevel || "N/A",
          accomplishments: [],
          applicationDate: app.appliedAt,
          status: app.status,
          answers: recruiterQnA.map((item) => item.answer),
          expectedSalary: u.profile.expectedSalary?.amount
            ? `${u.profile.expectedSalary.currency} ${u.profile.expectedSalary.amount}`
            : "Not Disclosed",
          noticePeriod: u.profile.noticePeriod || "N/A",
          location: u.profile.location || "N/A",
          coverLetter: app.coverLetter || "",
          matchScore: 0,
          notes: (app.notes || []).map(
            (n) => `${n.text} (${new Date(n.date).toISOString().split("T")[0]})`
          ),
          applicationHistory: [],
          source: "Direct",
        };
      })
      .filter(Boolean);

    res.status(200).json({ success: true, applicants });
  } catch (error) {
    next(error);
  }
};

const searchApplicants = async (req, res) => {
  try {
    const recruiterId = req.user.id;

    // 📌 Get recruiter’s jobs
    const jobs = await Job.find({ postedBy: recruiterId }).select("_id title skills");
    const jobIds = jobs.map((j) => j._id);

    // 📌 Filters from query params
    const {
      jobId, // filter by specific job
      status, // filter by application status
      dateRange, // e.g. "24h", "7d", "15d", "30d"
      minExp,
      maxExp, // experience range
      skills, // comma separated skills
      location, // applicant location
      minSalary,
      maxSalary, // expected salary range
      noticePeriod, // e.g. "immediate", "15", "30", "60"
      matchScore, // "high", "medium", "low"
      hasCoverLetter, // boolean
    } = req.query;

    // 1️⃣ Base filter → recruiter’s jobs
    let appFilter = { job: { $in: jobIds } };
    if (jobId && jobIds.includes(jobId)) appFilter.job = jobId;
    if (status) appFilter.status = status;

    // 2️⃣ Date filter
    if (dateRange) {
      let days = 0;
      if (dateRange === "24h") days = 1;
      else if (dateRange === "7d") days = 7;
      else if (dateRange === "15d") days = 15;
      else if (dateRange === "30d") days = 30;

      if (days > 0) {
        const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        appFilter.appliedAt = { $gte: fromDate };
      }
    }

    // 3️⃣ Fetch applications
    const applications = await Application.find(appFilter)
      .populate(
        "applicant",
        "name resumeUrl experience location skills expectedSalary noticePeriod"
      )
      .populate("job", "title skills createdAt");

    // 4️⃣ Apply applicant-level filters
    let results = applications.filter((app) => {
      const user = app.applicant;

      // Experience range
      if (minExp || maxExp) {
        const years = user.experience?.years || 0;
        if (minExp && years < Number(minExp)) return false;
        if (maxExp && years > Number(maxExp)) return false;
      }

      // Skills match
      if (skills) {
        const skillArray = skills.split(",").map((s) => s.trim().toLowerCase());
        if (!skillArray.every((s) => user.skills.map((u) => u.toLowerCase()).includes(s)))
          return false;
      }

      // Location
      if (
        location &&
        (!user.location || !user.location.toLowerCase().includes(location.toLowerCase()))
      )
        return false;

      // Salary range
      if (minSalary || maxSalary) {
        const expected = user.expectedSalary || 0;
        if (minSalary && expected < Number(minSalary)) return false;
        if (maxSalary && expected > Number(maxSalary)) return false;
      }

      // Notice period
      if (noticePeriod) {
        if (noticePeriod === "immediate" && user.noticePeriod !== "0") return false;
        if (noticePeriod !== "immediate" && user.noticePeriod !== noticePeriod)
          return false;
      }

      // Cover letter
      if (hasCoverLetter === "true" && !app.coverLetter) return false;
      if (hasCoverLetter === "false" && app.coverLetter) return false;

      // Match Score
      const jobSkills = app.job.skills || [];
      const userSkills = user.skills || [];
      const matched = userSkills.filter((s) =>
        jobSkills.map((j) => j.toLowerCase()).includes(s.toLowerCase())
      );
      const score = jobSkills.length
        ? Math.round((matched.length / jobSkills.length) * 100)
        : 0;

      if (matchScore === "high" && score < 80) return false;
      if (matchScore === "medium" && (score < 50 || score > 79)) return false;
      if (matchScore === "low" && score >= 50) return false;

      return true;
    });

    // 5️⃣ Format response
    const applicants = results.map((app) => {
      const user = app.applicant;
      return {
        applicationId: app._id,
        job: { title: app.job.title, id: app.job._id },
        applicant: {
          name: user.name,
          location: user.location,
          resume: user.resumeUrl,
          skills: user.skills,
          experience: user.experience,
          expectedSalary: user.expectedSalary,
          noticePeriod: user.noticePeriod,
        },
        coverLetter: app.coverLetter,
        status: app.status,
        appliedAt: app.appliedAt,
      };
    });

    res.status(200).json({ success: true, count: applicants.length, applicants });
  } catch (err) {
    console.error("searchApplicants error:", err);
    res.status(500).json({ success: false, message: "Failed to search applicants" });
  }
};

const bulkUpdateApplicants = async (req, res) => {
  try {
    const { applicationIds, status } = req.body;

    if (
      !applicationIds ||
      !Array.isArray(applicationIds) ||
      applicationIds.length === 0
    ) {
      return res.status(400).json({ success: false, message: "No applicants selected" });
    }

    const validStatuses = [
      "New",
      "Reviewed",
      "Shortlisted",
      "Interview Scheduled",
      "Hired",
      "Rejected",
    ];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const updated = await Application.updateMany(
      { _id: { $in: applicationIds } },
      { $set: { status: status || "shortlisted" } }
    );

    res.status(200).json({
      success: true,
      message: `${updated.modifiedCount} applicants updated to ${
        status || "shortlisted"
      }`,
    });
  } catch (err) {
    console.error("bulkUpdateApplicants error:", err);
    res.status(500).json({ success: false, message: "Failed to update applicants" });
  }
};

const downloadResumes = async (req, res) => {
  try {
    const { applicationIds } = req.body;

    if (
      !applicationIds ||
      !Array.isArray(applicationIds) ||
      applicationIds.length === 0
    ) {
      return res.status(400).json({ success: false, message: "No applicants selected" });
    }

    const applications = await Application.find({
      _id: { $in: applicationIds },
    }).populate("applicant", "resumeUrl name");

    // Create zip
    const archive = archiver("zip", { zlib: { level: 9 } });
    res.attachment("resumes.zip");
    archive.pipe(res);

    for (let app of applications) {
      if (app.applicant.resumeUrl) {
        // download from cloud storage (Cloudinary, S3, etc.)
        const response = await axios.get(app.applicant.resumeUrl, {
          responseType: "arraybuffer",
        });
        archive.append(response.data, {
          name: `${app.applicant.name.replace(" ", "_")}.pdf`,
        });
      }
    }

    await archive.finalize();
  } catch (err) {
    console.error("downloadResumes error:", err);
    res.status(500).json({ success: false, message: "Failed to download resumes" });
  }
};

const addNote = async (req, res) => {
  try {
    const { applicationId, note } = req.body;

    if (!applicationId || !note) {
      return res
        .status(400)
        .json({ success: false, message: "Application ID and note are required" });
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    application.notes.push({
      text: note,
      date: new Date(),
      author: req.user.name || "Recruiter",
    });

    await application.save();

    res.status(200).json({
      success: true,
      message: "Note added successfully",
      notes: application.notes,
    });
  } catch (err) {
    console.error("addNote error:", err);
    res.status(500).json({ success: false, message: "Failed to add note" });
  }
};

const bulkSendEmail = async (req, res) => {
  try {
    const { applicationIds, template, variables } = req.body;

    if (
      !applicationIds ||
      !Array.isArray(applicationIds) ||
      applicationIds.length === 0
    ) {
      return res.status(400).json({ success: false, message: "No applicants selected" });
    }

    if (!template) {
      return res
        .status(400)
        .json({ success: false, message: "Email template is required" });
    }

    // fetch applicants
    const applications = await Application.find({
      _id: { $in: applicationIds },
    }).populate("applicant", "email name");

    // send emails in parallel
    const sendOps = applications.map((app) => {
      const vars = {
        ...variables,
        name: app.applicant.name, // default replacement
        jobTitle: app.job?.title || "your application",
      };

      return sendEmail({
        to: app.applicant.email,
        template,
        variables: vars,
      });
    });

    await Promise.all(sendOps);

    res.status(200).json({
      success: true,
      message: `Emails sent to ${applications.length} applicants using template "${template}"`,
    });
  } catch (err) {
    console.error("bulkSendEmail error:", err);
    res.status(500).json({ success: false, message: "Failed to send bulk emails" });
  }
};

const changeJobStatus = async (req, res) => {
  try {
    const { jobId, status } = req.body;
    const recruiterId = req.user.id;

    const validStatuses = ["active", "paused", "closed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    // find job owned by recruiter
    const job = await Job.findOne({ _id: jobId, postedBy: recruiterId });
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    // prevent reactivating closed jobs
    if (job.status === "closed" && status !== "closed") {
      return res
        .status(400)
        .json({ success: false, message: "Closed jobs cannot be resumed" });
    }

    job.status = status;
    job.visibility = status === "active"; // only active jobs visible
    await job.save();

    res
      .status(200)
      .json({ success: true, message: `Job status updated to ${status}`, job });
  } catch (err) {
    console.error("changeJobStatus error:", err);
    res.status(500).json({ success: false, message: "Failed to update job status" });
  }
};

const updateJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const recruiterId = req.user.id;

    // whitelist fields that can be updated
    const updatableFields = [
      "title",
      "position",
      "companyName",
      "companyDescription",
      "companySocial",
      "jobType",
      "workMode", // Added
      "earningPotential",
      "fixedEarnings",
      "experienceLevel",
      "jobHighlights",
      "description",
      "requirements",
      "skills",
      "experience",
      "education",
      "educationalQualification", // Added
      "gender",
      "salary",
      "location",
      "questions",
      "applicationDeadline", // Added
      "industry", // Added
      "department", // Added
      "perksAndBenefits", // Added
      "shiftTimings", // Added
      "noticePeriodPreference", // Added
      "preferredCandidateLocation", // Added
      "hiringType", // Added
      "applicationInstructions", // Added
      "interviewProcessInfo", // Added
    ];

    const updateData = {};

    // Handle applicationDeadline -> expiryDate
    if (req.body.applicationDeadline) {
      updateData.expiryDate = new Date(req.body.applicationDeadline);
    }

    for (let field of updatableFields) {
      if (req.body[field] !== undefined) {
        if (
          ["requirements", "skills", "jobHighlights", "perksAndBenefits"].includes(
            field
          ) &&
          typeof req.body[field] === "string"
        ) {
          updateData[field] = req.body[field]
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s !== "");
        } else {
          updateData[field] = req.body[field];
        }
      }
    }

    // handle recruiter questions update (max 5)
    if (updateData.questions && Array.isArray(updateData.questions)) {
      if (updateData.questions.length > 5) {
        return res
          .status(400)
          .json({ success: false, message: "Max 5 questions allowed" });
      }
      updateData.questions = updateData.questions.map((q) => ({
        question: q.question,
        type: q.type === "boolean" ? "boolean" : "text",
      }));
    }

    const job = await Job.findOneAndUpdate(
      { _id: jobId, postedBy: recruiterId },
      { $set: updateData },
      { new: true }
    );

    if (!job) {
      return res
        .status(404)
        .json({ success: false, message: "Job not found or not owned by recruiter" });
    }

    res.status(200).json({ success: true, message: "Job updated successfully", job });
  } catch (err) {
    console.error("updateJob error:", err);
    res.status(500).json({ success: false, message: "Failed to update job" });
  }
};

const deleteJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const recruiterId = req.user.id;

    const job = await Job.findOneAndDelete({ _id: jobId, postedBy: recruiterId });

    if (!job) {
      return res
        .status(404)
        .json({ success: false, message: "Job not found or not owned by recruiter" });
    }

    // remove reference from recruiter.jobsPosted
    await Recruiter.findByIdAndUpdate(recruiterId, { $pull: { jobsPosted: jobId } });

    // optionally delete applications related to the job
    await Application.deleteMany({ job: jobId });

    res.status(200).json({ success: true, message: "Job deleted successfully" });
  } catch (err) {
    console.error("deleteJob error:", err);
    res.status(500).json({ success: false, message: "Failed to delete job" });
  }
};

// Job - jobs mangement
const getAllPostedJobs = async (req, res, next) => {
  try {
    const companyId = req.user.company;
    if (!companyId) {
      return res
        .status(403)
        .json({ success: false, msg: "User is not associated with a company." });
    }

    // Use postedBy or company logic.
    // If the user is a team member, they might want to see all jobs for the company (recruiter).
    // The 'company' field on the Job model stores the Recruiter ID.
    // req.user.company is set in auth middleware for both Recruiter and TeamMember.

    // However, let's be robust.
    let query = {};
    if (req.user.role === "recruiter" || req.user.role === "Admin") {
      // Recruiter sees all jobs they posted OR jobs where they are the company
      query = { $or: [{ postedBy: req.user.id }, { company: req.user.id }] };
    } else if (req.user.role === "team_member") {
      // Team member sees jobs for their company
      if (req.user.company) {
        query = { company: req.user.company };
      } else {
        // Fallback if company not set (shouldn't happen with proper auth)
        query = { postedBy: req.user.id };
      }
    }

    const jobsWithCompany = await Job.find(query)
      .populate("company")
      .populate("postedByUser", "name") // Changed from postedBy to postedByUser for name
      .sort({ createdAt: -1 }) // Sort by createdAt usually better
      .lean();

    const formattedJobsFinal = await Promise.all(
      jobsWithCompany.map(async (job) => {
        const applicationCount = await Application.countDocuments({ job: job._id });
        const { _id, __v, ...rest } = job;

        return {
          ...rest,
          id: job._id.toString(),
          applicants: applicationCount, // Use 'applicants' to match frontend type
        };
      })
    );

    res.status(200).json({
      success: true,
      count: formattedJobsFinal.length,
      jobs: formattedJobsFinal,
    });
  } catch (err) {
    next(err);
  }
};

// Get single job by ID (for recruiter)
const getRecruiterJobById = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    let query = { _id: jobId };
    if (req.user.role === "recruiter" || req.user.role === "Admin") {
      query.$or = [{ postedBy: req.user.id }, { company: req.user.id }];
    } else if (req.user.role === "team_member") {
      if (req.user.company) {
        query.company = req.user.company;
      } else {
        query.postedBy = req.user.id;
      }
    }

    const job = await Job.findOne(query)
      .populate("company")
      .populate("postedByUser", "name");

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found or you do not have permission to view it.",
      });
    }

    const jobObject = job.toObject();
    jobObject.id = jobObject._id.toString();

    // The frontend expects the job object itself inside a 'job' key for this endpoint.
    res.status(200).json({ success: true, job: jobObject });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPublicCompanies,
  getPublicCompanyById,
  addNote,
  addJob,
  changeApplicantStatus,
  getRecruiterAnalytics,
  getAllApplicants,
  getApplicantsForJob,
  searchApplicants,
  bulkUpdateApplicants,
  downloadResumes,
  bulkSendEmail,
  changeJobStatus,
  updateJob,
  deleteJob,
  getAllPostedJobs,
  getRecruiterJobById,
};
