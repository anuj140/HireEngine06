
const User = require("../models/User");
const Job = require("../models/Job");
const Recruiter = require("../models/Recruiter");
const Application = require("../models/Application");
const CompanyProfile = require("../models/CompanyProfile");
const Subscription = require("../models/Subcription"); // Note the typo in filename
const Admin = require("../models/Admin");
const TeamMember = require("../models/TeamMember");

// Helper to determine date range query
const getDateFilter = (filter, start, end) => {
    const now = new Date();
    let dateQuery = {};

    switch (filter) {
        case 'day': // Today
            const startOfDay = new Date(now.setHours(0, 0, 0, 0));
            const endOfDay = new Date(now.setHours(23, 59, 59, 999));
            dateQuery = { $gte: startOfDay, $lte: endOfDay };
            break;
        case 'week': // Last 7 days
            const last7Days = new Date();
            last7Days.setDate(last7Days.getDate() - 7);
            dateQuery = { $gte: last7Days, $lte: new Date() };
            break;
        case 'month': // Last 30 days
            const last30Days = new Date();
            last30Days.setDate(last30Days.getDate() - 30);
            dateQuery = { $gte: last30Days, $lte: new Date() };
            break;
        case 'year': // Last 365 days
            const lastYear = new Date();
            lastYear.setFullYear(lastYear.getFullYear() - 1);
            dateQuery = { $gte: lastYear, $lte: new Date() };
            break;
        case 'custom':
            if (start && end) {
                dateQuery = { $gte: new Date(start), $lte: new Date(end) };
            }
            break;
        case 'all':
        default:
            return {}; // No filter
    }
    return dateQuery;
};

const getAdminAnalytics = async (req, res) => {
    try {
        const { filter = 'all', startDate, endDate } = req.query;

        const dateFilter = getDateFilter(filter, startDate, endDate);
        const createdAtQuery = dateFilter.$gte ? { createdAt: dateFilter } : {};
        const paymentDateQuery = dateFilter.$gte ? { "payment.paidAt": dateFilter } : {};
        const appliedAtQuery = dateFilter.$gte ? { appliedAt: dateFilter } : {};

        // --- KPIs ---
        // Match logic from adminUserController.js: Sum of all user-like collections
        const [userCount, recruiterCount, teamCount, adminCount] = await Promise.all([
            User.countDocuments({ ...createdAtQuery, role: { $in: ["JobSeeker", "user"] } }), // Explicitly count only JobSeekers/Users
            Recruiter.countDocuments({ ...createdAtQuery }),
            TeamMember.countDocuments({ ...createdAtQuery }),
            Admin.countDocuments({ ...createdAtQuery })
        ]);
        const totalUsers = userCount + recruiterCount + teamCount + adminCount;

        const totalCompanies = recruiterCount;

        // Active Jobs: Count based on status only to match Admin Jobs list
        // FIX: Ensure we only count jobs that are both Active AND Approved
        const activeJobs = await Job.countDocuments({
            status: "active",
            approvalStatus: "approved",
            ...createdAtQuery
        });

        // Total Applications: Sum of 'applicants' array length across all jobs
        const totalApplications = await Application.countDocuments({ ...appliedAtQuery });

        // Calculate pending approval jobs
        const pendingJobs = await Job.countDocuments({ status: "pending", ...createdAtQuery });

        // Revenue - Calculated from successful subscription payments
        const revenueData = await Subscription.aggregate([
            { $match: { "payment.paymentStatus": "completed", ...paymentDateQuery } },
            { $group: { _id: null, total: { $sum: "$payment.amount" } } }
        ]);
        const revenue = revenueData.length > 0 ? revenueData[0].total : 0;

        // --- Time Series Data (New Users & Jobs Posted) ---
        // Simplified: Group by Month for last 6 months or based on range
        // For time series, if a filter is active, we should show data within that range.
        // If "all", we default to last 6 months or 1 year. 
        // If filter is 'day', time series might be by hour? (Too complex for now, sticking to daily/monthly grouping)
        // Let's use the dateFilter for matching.

        let matchStage = dateFilter.$gte ? { createdAt: dateFilter } : { createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) } };

        const userSignups = await User.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, // Group by Day for better granularity
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        const jobsPosted = await Job.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // Merge time series
        const timeSeriesMap = new Map();
        userSignups.forEach(u => timeSeriesMap.set(u._id, { date: u._id, userSignups: u.count, jobsPosted: 0 }));
        jobsPosted.forEach(j => {
            if (timeSeriesMap.has(j._id)) {
                timeSeriesMap.get(j._id).jobsPosted = j.count;
            } else {
                timeSeriesMap.set(j._id, { date: j._id, userSignups: 0, jobsPosted: j.count });
            }
        });
        const timeSeriesData = Array.from(timeSeriesMap.values()).sort((a, b) => a.date.localeCompare(b.date));

        // --- User Role Distribution ---
        // Simplified and clearer mapping
        const userRoleData = [
            { name: 'Job Seekers', value: userCount },
            { name: 'Recruiters', value: recruiterCount },
            { name: 'Team Members', value: teamCount },
            { name: 'Admins', value: adminCount }
        ].filter(item => item.value > 0); // Only show roles that have users

        // --- Industry Data (Top 5) ---
        // Join Recruiter -> CompanyProfile to get industry? Or direct if CompanyProfile has it.
        // CompanyProfile has industry.
        const industries = await CompanyProfile.aggregate([
            { $match: { industry: { $exists: true, $ne: "" }, ...createdAtQuery } },
            { $group: { _id: "$industry", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);
        const industryData = industries.map(i => ({ name: i._id, value: i.count }));

        // --- Pipeline Data (Application Status) ---
        const pipeline = await Application.aggregate([
            { $match: { ...appliedAtQuery } },
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]);

        // Define standard pipeline stages and fill colors
        const colors = { 'New': '#8884d8', 'Reviewed': '#83a6ed', 'Shortlisted': '#8dd1e1', 'Interview Scheduled': '#82ca9d', 'Hired': '#a4de6c', 'Rejected': '#ff6b6b' };

        // Sort logic (custom order)
        const stageOrder = ['New', 'Reviewed', 'Shortlisted', 'Interview Scheduled', 'Hired', 'Rejected'];
        const pipelineData = pipeline
            .map(p => ({ name: p._id, value: p.count, fill: colors[p._id] || '#ccc' }))
            .sort((a, b) => stageOrder.indexOf(a.name) - stageOrder.indexOf(b.name));

        // --- Top Hiring Companies ---
        // Companies with most active jobs and applications
        const topCompanies = await Job.aggregate([
            { $match: { status: 'active', ...createdAtQuery } },
            {
                $lookup: {
                    from: 'applications',
                    localField: '_id',
                    foreignField: 'job',
                    as: 'apps'
                }
            },
            {
                $group: {
                    _id: '$company',
                    jobCount: { $sum: 1 },
                    applicationsCount: { $sum: { $size: '$apps' } }
                }
            },
            { $sort: { jobCount: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'recruiters',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'companyInfo'
                }
            },
            { $unwind: '$companyInfo' },
            {
                $project: {
                    id: '$_id',
                    name: '$companyInfo.companyName',
                    logo: '$companyInfo.logoUrl',
                    activeJobs: '$jobCount',
                    applications: '$applicationsCount'
                }
            }
        ]);

        // TODO: Fix logo and applications count if critical. 
        // Recruiter model uses `companyName`? Need to check Recruiter model.

        res.status(200).json({
            success: true,
            kpis: {
                totalUsers,
                totalCompanies,
                activeJobs,
                totalApplications,
                pendingJobs,
                revenue
            },
            timeSeriesData,
            userRoleData,
            industryData,
            pipelineData,
            topCompanies
        });
    } catch (error) {
        console.error("Analytics Error:", error);
        res.status(500).json({ success: false, message: "Server Error fetching analytics" });
    }
};

module.exports = { getAdminAnalytics };
