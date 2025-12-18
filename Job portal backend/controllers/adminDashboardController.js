const User = require("../models/User");
const Recruiter = require("../models/Recruiter");
const Job = require("../models/Job");
const Application = require("../models/Application");
const Subscription = require("../models/Subcription");
const Admin = require("../models/Admin");
const TeamMember = require("../models/TeamMember");

// Helper to determine date range query
const getDateFilter = (range) => {
  const now = new Date();
  let dateQuery = {};

  switch (range) {
    case '7d': // Last 7 days
      const last7Days = new Date();
      last7Days.setDate(last7Days.getDate() - 7);
      dateQuery = { $gte: last7Days };
      break;
    case '30d': // Last 30 days
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);
      dateQuery = { $gte: last30Days };
      break;
    case '1y': // Last 365 days
      const lastYear = new Date();
      lastYear.setFullYear(lastYear.getFullYear() - 1);
      dateQuery = { $gte: lastYear };
      break;
    case 'all':
    default:
      return {}; // No filter
  }
  return dateQuery;
};

// Growth calculation helper
const calculateGrowth = async (Model, currentQuery, range) => {
  // If 'all', growth isn't really meaningful or we can show growth vs last year?
  // Let's keep it simple: Compare current range vs previous period of same length.
  if (range === 'all') return 0; // Or calculate total MoM regardless

  const now = new Date();
  let prevStart, prevEnd;

  // Approximating previous periods
  if (range === '7d') {
    prevEnd = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    prevStart = new Date(prevEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (range === '30d') {
    prevEnd = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    prevStart = new Date(prevEnd.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (range === '1y') {
    prevEnd = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    prevStart = new Date(prevEnd.getFullYear() - 1, prevEnd.getMonth(), prevEnd.getDate());
  }

  const currentCount = await Model.countDocuments(currentQuery);
  const prevCount = await Model.countDocuments({ createdAt: { $gte: prevStart, $lte: prevEnd } });

  if (prevCount === 0) return currentCount > 0 ? 100 : 0;
  return (((currentCount - prevCount) / prevCount) * 100).toFixed(1);
};


exports.getAdminDashboardStats = async (req, res) => {
  try {
    const { range = 'all' } = req.query;
    const dateQuery = getDateFilter(range);

    // Map dateQuery to specific fields
    const createdAtQuery = dateQuery.$gte ? { createdAt: dateQuery } : {};
    const paymentQuery = dateQuery.$gte ? { "payment.paidAt": dateQuery } : {};
    const appliedAtQuery = dateQuery.$gte ? { appliedAt: dateQuery } : {};

    // --- KPIs ---

    // Total Users (Sum of all types)
    const [userCount, recruiterCount, teamCount, adminCount] = await Promise.all([
      User.countDocuments({ ...createdAtQuery, role: { $in: ["JobSeeker", "user"] } }),
      Recruiter.countDocuments({ ...createdAtQuery }),
      TeamMember.countDocuments({ ...createdAtQuery }),
      Admin.countDocuments({ ...createdAtQuery })
    ]);
    const totalUsers = userCount + recruiterCount + teamCount + adminCount;
    // Growth for Users (using User model as proxy for general growth or sum all? keeping it simple: User model)
    const userGrowth = await calculateGrowth(User, { ...createdAtQuery, role: { $in: ["JobSeeker", "user"] } }, range);


    // Total Companies
    const totalCompanies = recruiterCount;
    const companyGrowth = await calculateGrowth(Recruiter, { ...createdAtQuery }, range);

    // Active Users (Note: 'Active' status usually means not blocked. Activity 'in range' might mean 'loginBy', but we don't track loginBy well yet in these models globally. Falling back to status='Active')
    // Correct interpretation: How many users are currently 'active' status in the platform?
    // Filtering by date range for "Total Active Users" is weird. Usually "Active Users" is a snapshot.
    // However, if range is '7d', user might expect "Active users who registered in last 7 days" OR "Users active in last 7 days".
    // Given the context of "Dashboard Stats" with a date filter, it usually implies "Stats for entities created/active in this period".
    // Let's count *Total* `isActive` users filtered by creation date (New Active Users) OR just snapshot? 
    // Let's stick to "Count of Users matching the date filter who are Active".
    const activeUsers = await User.countDocuments({ isActive: true, ...createdAtQuery }) + await Recruiter.countDocuments({ isActive: true, ...createdAtQuery });

    // Revenue
    const revenueData = await Subscription.aggregate([
      { $match: { "payment.paymentStatus": "completed", ...paymentQuery } },
      { $group: { _id: null, total: { $sum: "$payment.amount" } } }
    ]);
    const revenue = revenueData.length > 0 ? revenueData[0].total : 0;

    // Revenue Growth (This is hard to genericize with calculateGrowth helper due to aggregation, skipping for now or hardcoding 0)
    const revenueGrowth = 0;


    // Active Jobs (Snapshot of currently active jobs that were Created in this range? Or just active jobs?)
    // Usually "Active Jobs" is a snapshot state. If we filter by date, we might mean "Jobs posted in this range that are active".
    const activeJobs = await Job.countDocuments({ status: "active", approvalStatus: "approved", ...createdAtQuery });

    // Applications
    const totalApplications = await Application.countDocuments({ ...appliedAtQuery });

    // --- Charts ---
    // Bar Graph: Signups per month (past 6 months) - If range is 'all' or '1y'.
    // If range is '7d' or '30d', maybe daily?
    // Keeping existing "Last 6 Months/Custom" logic but using range.

    // If range is short (7d, 30d), group by day. Else month.
    const groupByFormat = (range === '7d' || range === '30d') ? "%Y-%m-%d" : "%Y-%m";
    const graphStartDate = dateQuery.$gte ? dateQuery.$gte : new Date(new Date().setFullYear(new Date().getFullYear() - 1));

    const userSignupsSeries = await User.aggregate([
      { $match: { createdAt: { $gte: graphStartDate } } },
      {
        $group: {
          _id: { $dateToString: { format: groupByFormat, date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const barData = userSignupsSeries.map((m) => ({
      month: m._id, // Label (Day or Month)
      count: m.count,
    }));

    // Revenue Chart Data
    const revenueSeries = await Subscription.aggregate([
      { $match: { "payment.paymentStatus": "completed", "payment.paidAt": { $gte: graphStartDate } } },
      {
        $group: {
          _id: { $dateToString: { format: groupByFormat, date: "$payment.paidAt" } },
          total: { $sum: "$payment.amount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const revenueChartData = revenueSeries.map(r => ({
      name: r._id,
      revenue: r.total
    }));

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalCompanies,
        activeUsers,
        totalApplications,
        activeJobs,
        revenue,
        userGrowth,
        companyGrowth,
        revenueGrowth,
        barData,
        revenueChartData
      },
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch dashboard stats" });
  }
};
