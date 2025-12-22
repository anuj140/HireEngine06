const Job = require("../models/Job");
const User = require("../models/User");
const Recruiter = require("../models/Recruiter");
const mongoose = require("mongoose");

// Helper to escape regex characters
const escapeRegex = (text) => {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

// Helper to format relative time
const formatRelativeTime = (date) => {
  const now = new Date();
  const posted = new Date(date);
  const diffTime = Math.abs(now - posted);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return "Today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;

  const weeks = Math.floor(diffDays / 7);
  if (weeks === 1) return "1 week ago";
  if (weeks < 4) return `${weeks} weeks ago`;

  const months = Math.floor(diffDays / 30);
  if (months === 1) return "1 month ago";
  if (months < 12) return `${months} months ago`;

  const years = Math.floor(diffDays / 365);
  if (years === 1) return "1 year ago";
  return `${years} years ago`;
};

// Get all jobs (with optional filters)
const getJobs = async (req, res, next) => {
  try {
    const { keywords, location, experience, jobType, postedDate, minSalary, maxSalary } =
      req.query;

    // --- 1. Intelligent Company Search Logic ---
    if (keywords) {
      const safeKeywords = escapeRegex(keywords);
      const companyRegex = new RegExp(safeKeywords, "i"); // Partial match

      //! It always search companyName for keword (it does not make any sense keyword searching for only in companName)
      const company = await Recruiter.findOne({
        companyName: companyRegex,
        isActive: true,
      }).select("-password");

      if (company) {
        // A. Get Jobs for this specific company
        const companyJobsDocs = await Job.find({
          postedBy: company._id,
          status: "active",
          visibility: true,
        })
          .populate(
            "postedBy",
            "companyName logo rating reviews shortDescription aboutUs"
          )
          .sort({ createdAt: -1 })
          .lean();

        // B. Get Related Jobs (Same Industry, Different Company)
        let relatedJobsDocs = [];
        if (company.industry) {
          relatedJobsDocs = await Job.find({
            status: "active",
            visibility: true,
            postedBy: { $ne: company._id }, // Not this company
            industry: company.industry,
          })
            .populate(
              "postedBy",
              "companyName logo rating reviews shortDescription aboutUs"
            )
            .limit(10)
            .sort({ createdAt: -1 })
            .lean();
        }

        //* Review later - to understand
        // Helper to format jobs
        const formatJob = (job) => {
          const { _id, postedBy, __v, ...rest } = job;
          const comp = postedBy
            ? {
                id: postedBy._id.toString(),
                name: postedBy.companyName,
                logoUrl: postedBy.logoUrl,
                description: postedBy.shortDescription || postedBy.aboutUs || "",
                rating: postedBy.rating || 0,
                reviews: postedBy.reviews || 0,
              }
            : {
                id: "unknown",
                name: "Confidential",
                logoUrl: "",
                description: "",
                rating: 0,
                reviews: 0,
              };

          return {
            ...rest,
            id: _id.toString(),
            company: comp,
            applicants: job.applicants?.length || 0,
            postedDate: formatRelativeTime(job.createdAt),
          };
        };

        const companyProfile = {
          id: company._id.toString(),
          name: company.companyName,
          logoUrl: company.logoUrl,
          bannerUrl: company.bannerUrl,
          description: company.description || "",
          rating: company.rating || 0,
          reviews: company.reviews || 0,
          industry: company.industry,
          location: company.headquarters,
          website: company.website,
          tagline: company.tagline,
        };

        //? Why "isCompanySearch" set to true, to display in return response
        return res.status(200).json({
          isCompanySearch: true,
          companyProfile,
          companyJobs: companyJobsDocs.map(formatJob),
          relatedJobs: relatedJobsDocs.map(formatJob),
          totalJobs: companyJobsDocs.length,
        });
      }
    }

    // --- 2. Standard Search Logic ---
    const query = { status: "active", visibility: true, approvalStatus: "approved" };

    if (location) {
      query.location = { $regex: location, $options: "i" };
    }
    if (jobType) {
      query.jobType = { $in: jobType.split(",") };
    }
    if (experience === "0") {
      query.experienceLevel = "internship";
    } else if (experience) {
      const numericExp = parseInt(experience, 10);
      if (!isNaN(numericExp)) {
        query.experience = { $regex: new RegExp(`^${numericExp}|${numericExp}-`) };
      }
    }

    if (postedDate) {
      const date = new Date();
      date.setDate(date.getDate() - parseInt(postedDate));
      query.createdAt = { $gte: date };
    }

    if (minSalary || maxSalary) {
      const salaryFilter = {};
      if (minSalary) salaryFilter.$gte = parseInt(minSalary, 10);
      if (maxSalary) salaryFilter.$lte = parseInt(maxSalary, 10);
      query.salary = salaryFilter;
    }

    if (keywords) {
      const safeKeywords = escapeRegex(keywords);
      const keywordRegex = new RegExp(safeKeywords, "i");

      query.$or = [
        { title: keywordRegex },
        { skills: keywordRegex },
        { description: keywordRegex },
        { companyName: keywordRegex },
      ];
    }

    const [jobDocs, totalJobs] = await Promise.all([
      Job.find(query)
        .populate("postedBy", "companyName logo rating reviews shortDescription aboutUs")
        .sort({ createdAt: -1 })
        .lean(),
      Job.countDocuments(query),
    ]);

    const jobs = jobDocs.map((job) => {
      const { _id, postedBy, __v, ...rest } = job;

      const company = postedBy
        ? {
            id: postedBy._id.toString(),
            name: postedBy.companyName,
            logoUrl: postedBy.logo || postedBy.logoUrl,
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
        company: company,
        applicants: job.applicants?.length || 0,
        postedDate: formatRelativeTime(job.createdAt),
      };
    });

    res.status(200).json({
      isCompanySearch: false,
      jobs,
      totalJobs,
    });
  } catch (err) {
    next(err);
  }
};

// Get single job detail by ID
const getJobById = async (req, res, next) => {
  try {
    const jobId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res
        .status(404)
        .json({ success: false, message: "Job not found (invalid ID format)" });
    }

    const job = await Job.findById(jobId).populate("postedBy", "-password");

    if (!job || job.status !== "active" || job.approvalStatus !== "approved") {
      return res
        .status(404)
        .json({ success: false, message: "Job not found or inactive" });
    }

    const jobObject = job.toObject();
    jobObject.id = jobObject._id.toString();

    // Transform applicants array to count
    jobObject.applicants = job.applicants ? job.applicants.length : 0;

    // Compatibility fix
    if (
      (!jobObject.questions || jobObject.questions.length === 0) &&
      jobObject.recruiterQuestions &&
      jobObject.recruiterQuestions.length > 0
    ) {
      jobObject.questions = jobObject.recruiterQuestions.map((q) => ({
        question: q,
        type: "text",
      }));
    }

    // Preserve createdAt for logic like "Early Applicant" check
    jobObject.postedDate = formatRelativeTime(jobObject.createdAt);
    delete jobObject._id;
    delete jobObject.updatedAt;
    delete jobObject.__v;

    if (jobObject.postedBy) {
      const recruiter = jobObject.postedBy;
      jobObject.company = {
        id: recruiter._id.toString(),
        name: recruiter.companyName,
        logoUrl: recruiter.logo || recruiter.logoUrl,
        description: recruiter.shortDescription || recruiter.aboutUs || "",
        rating: recruiter.rating || 4.1,
        reviews: recruiter.reviews || 42,
      };
      delete jobObject.postedBy;
    } else {
      jobObject.company = {
        id: "unknown-company",
        name: jobObject.companyName || "Confidential",
        logoUrl: "https://via.placeholder.com/150",
        description: "",
        rating: 0,
        reviews: 0,
      };
    }

    return res.status(200).json({ success: true, job: jobObject });
  } catch (err) {
    next(err);
  }
};

// Get recommended jobs for the logged-in user
const getRecommendedJobs = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("profile").lean();

    const formatJobs = (jobs) =>
      jobs.map((j) => {
        const { _id, postedBy, __v, ...rest } = j;
        const company = postedBy
          ? {
              id: postedBy._id.toString(),
              name: postedBy.companyName,
              logoUrl: postedBy.logo || postedBy.logoUrl,
              description: postedBy.shortDescription || postedBy.aboutUs || "",
              rating: postedBy.rating || 4.0,
              reviews: postedBy.reviews || 0,
            }
          : {
              id: "unknown",
              name: j.companyName || "Confidential",
              logoUrl: "https://via.placeholder.com/150",
              description: "",
              rating: 0,
              reviews: 0,
            };

        const { createdAt, updatedAt, ...jobRest } = rest;

        return {
          ...jobRest,
          id: _id.toString(),
          company,
          applicants: j.applicants?.length || 0,
          postedDate: formatRelativeTime(j.createdAt),
        };
      });

    if (
      !user ||
      !user.profile ||
      !user.profile.skills ||
      user.profile.skills.length === 0
    ) {
      const latestJobs = await Job.find({ status: "active", visibility: true })
        .populate("postedBy")
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();
      return res.json(formatJobs(latestJobs));
    }

    const userSkills = user.profile.skills.map((s) => new RegExp(s, "i"));

    const recommendedJobs = await Job.find({
      status: "active",
      visibility: true,
      approvalStatus: "approved",
      $or: [
        { skills: { $in: userSkills } },
        { title: { $in: userSkills } },
        { industry: user.profile.careerProfile?.currentIndustry },
      ],
    })
      .populate("postedBy")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    if (recommendedJobs.length < 20) {
      let recommendedIds = recommendedJobs.map((j) => j._id);
      const latestJobs = await Job.find({
        status: "active",
        visibility: true,
        _id: { $nin: recommendedIds },
      })
        .populate("postedBy")
        .sort({ createdAt: -1 })
        .limit(20 - recommendedJobs.length)
        .lean();
      recommendedJobs = [...recommendedJobs, ...latestJobs];
    }

    res.json(formatJobs(recommendedJobs));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getJobs,
  getJobById,
  getRecommendedJobs,
};
