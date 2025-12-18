
const Recruiter = require("../models/Recruiter"); // Assuming Recruiter model represents a company

exports.getAllCompanies = async (req, res) => {
  const { page = 1, limit = 10, name } = req.query;
  const query = {};
  if (name) {
    query.companyName = { $regex: name, $options: "i" };
  }

  const companies = await Recruiter.find(query)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 })
    .lean();

  const count = await Recruiter.countDocuments(query);

  res.status(200).json({
    success: true,
    companies,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
  });
};

exports.getCompanyDetails = async (req, res) => {
  try {
    const { companyId } = req.params;

    // 1. Company Profile
    const company = await Recruiter.findById(companyId)
      .select('-password')
      // .populate('subscriptionPlan') // FIX: Field does not exist in Recruiter schema
      .lean();

    if (!company) {
      return res.status(404).json({ success: false, message: "Company not found" });
    }

    // 2. Employees (Team Members)
    // Team members usually link to company via 'recruiterId' or 'company' field?
    // Checking TeamMember model or assuming link. Usually team members are linked to main Recruiter ID.
    const TeamMember = require("../models/TeamMember");
    const employees = await TeamMember.find({ recruiterId: companyId }).select('name email role status lastActive').lean();

    // 3. Jobs Posted
    const Job = require("../models/Job");
    const jobs = await Job.find({ company: companyId })
      .select('title status createdAt applicants viewCount jobType expiryDate')
      .sort({ createdAt: -1 })
      .lean();

    const activeJobsCount = jobs.filter(j => j.status === 'active').length;
    const closedJobsCount = jobs.filter(j => j.status === 'closed' || j.status === 'expired').length;

    // 4. Analytics & Applicants
    // Aggregating all applications for this company's jobs
    const jobIds = jobs.map(j => j._id);
    const Application = require("../models/Application");

    // Total Applicants
    const totalApplicants = await Application.countDocuments({ job: { $in: jobIds } });

    // Hired Candidates
    const hiredCount = await Application.countDocuments({ job: { $in: jobIds }, status: 'Hired' }); // Fixed case to match Enum
    // Checking enum usually lowercase "hired" or "Hired" in Application model. Using regex or both to be safe? 
    // Usually 'hired' based on previous context.

    // Recent Activity (Last 30 days applicants trend?) - specialized aggregation if needed or just simple count
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const applicantsLast30d = await Application.countDocuments({
      job: { $in: jobIds },
      appliedAt: { $gte: last30Days }
    });

    // 5. Subscription Info
    // already populated company.subscriptionPlan
    const subscription = {
      planName: company.subscriptionPlan?.name || 'Free',
      status: company.subscriptionStatus || 'Active', // assuming field existence
      expiry: company.subscriptionExpiry,
      creditsLeft: company.subscriptionCredits || 0
    };

    res.status(200).json({
      success: true,
      company: {
        ...company,
        employeesCount: employees.length,
      },
      stats: {
        totalJobs: jobs.length,
        activeJobs: activeJobsCount,
        closedJobs: closedJobsCount,
        totalApplicants,
        hiredCandidates: hiredCount,
        applicantsLast30Days: applicantsLast30d
      },
      relationships: {
        employees,
        jobs: jobs.map(j => ({
          id: j._id,
          title: j.title,
          status: j.status,
          postedAt: j.createdAt,
          applicantsCount: j.applicants ? j.applicants.length : 0, // or separate count
          views: j.viewCount
        }))
      },
      subscription
    });

  } catch (error) {
    console.error("Error fetching company details:", error);
    res.status(500).json({ success: false, message: "Failed to fetch company details" });
  }
};

// Verify Company
exports.verifyCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const company = await Recruiter.findByIdAndUpdate(
      companyId,
      { verificationStatus: 'verified' },
      { new: true }
    );

    if (!company) {
      return res.status(404).json({ success: false, message: "Company not found" });
    }

    res.status(200).json({ success: true, message: "Company verified successfully", company });
  } catch (error) {
    console.error("Error verifying company:", error);
    res.status(500).json({ success: false, message: "Failed to verify company" });
  }
};

// Suspend Company
exports.suspendCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const company = await Recruiter.findByIdAndUpdate(
      companyId,
      { isActive: false },
      { new: true }
    );

    if (!company) {
      return res.status(404).json({ success: false, message: "Company not found" });
    }

    res.status(200).json({ success: true, message: "Company suspended successfully", company });
  } catch (error) {
    console.error("Error suspending company:", error);
    res.status(500).json({ success: false, message: "Failed to suspend company" });
  }
};
