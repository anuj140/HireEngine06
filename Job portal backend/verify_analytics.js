
const mongoose = require('mongoose');
const User = require('./models/User');
const Job = require('./models/Job');
const Recruiter = require('./models/Recruiter');
const Application = require('./models/Application');
const CompanyProfile = require('./models/CompanyProfile');
const Subscription = require('./models/Subcription');
const Admin = require('./models/Admin');
const TeamMember = require('./models/TeamMember');
require('dotenv').config();

const runVerification = async () => {
    try {
        console.log("Connecting to DB...");
        // Use local DB string if .env not available or hardcoded for test
        const dbUrl = process.env.MONGO_URI || "mongodb://localhost:27017/hireEngine";
        console.log("Using URI:", dbUrl);

        await mongoose.connect(dbUrl);
        console.log("Connected.");

        const createdAtQuery = {};
        const paymentDateQuery = {};
        const appliedAtQuery = {};

        console.log("\n--- Checking Counts ---");

        const userCount = await User.countDocuments({ ...createdAtQuery, role: { $in: ["JobSeeker", "user"] } });
        console.log(`JobSeekers/Users: ${userCount}`);

        const recruiterCount = await Recruiter.countDocuments({ ...createdAtQuery });
        console.log(`Recruiters: ${recruiterCount}`);

        const teamCount = await TeamMember.countDocuments({ ...createdAtQuery });
        console.log(`TeamMembers: ${teamCount}`);

        const adminCount = await Admin.countDocuments({ ...createdAtQuery });
        console.log(`Admins: ${adminCount}`);

        const totalUsers = userCount + recruiterCount + teamCount + adminCount;
        console.log(`Total Users (Sum): ${totalUsers}`);

        const activeJobs = await Job.countDocuments({
            status: "active",
            approvalStatus: "approved",
            ...createdAtQuery
        });
        console.log(`Active Jobs (Active + Approved): ${activeJobs}`);

        const totalApplications = await Application.countDocuments({ ...appliedAtQuery });
        console.log(`Total Applications: ${totalApplications}`);

        const revenueData = await Subscription.aggregate([
            { $match: { "payment.paymentStatus": "completed", ...paymentDateQuery } },
            { $group: { _id: null, total: { $sum: "$payment.amount" } } }
        ]);
        const revenue = revenueData.length > 0 ? revenueData[0].total : 0;
        console.log(`Revenue: ${revenue}`);

        console.log("\n--- Top Companies Query ---");
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
                    from: 'recruiters', // Ensure this matches collection name! Usually 'recruiters' lowercase
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
        console.log("Top Companies Count:", topCompanies.length);
        if (topCompanies.length > 0) console.log("Sample Company:", JSON.stringify(topCompanies[0], null, 2));

        console.log("\n--- Verification Complete ---");

    } catch (error) {
        console.error("Verification Failed:", error);
    } finally {
        await mongoose.disconnect();
    }
};

runVerification();
