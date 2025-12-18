const mongoose = require('mongoose');
const Job = require('../models/Job');
const Subscription = require('../models/Subcription');
require('dotenv').config();

const pauseExpiredJobs = async () => {
    console.log('Running job expiry check...');
    // Find all active jobs
    const activeJobs = await Job.find({ status: 'active' }).populate('postedBy');

    let pausedCount = 0;

    for (const job of activeJobs) {
        // Determine recruiter ID
        let recruiterId = job.postedBy;
        if (job.postedByModel === 'TeamMember') {
            // If posted by team member, we need to find the main recruiter
            // Assuming job.postedBy is the recruiter ID as set in createJobForApproval
            // But let's verify. In createJobForApproval: jobPayload.postedBy = req.user.recruiterId;
            // So job.postedBy is correct.
        }

        // Get active subscription
        const sub = await Subscription.findOne({
            recruiterId: recruiterId,
            status: 'active',
        }).populate('plan');

        if (!sub) {
            // No active subscription? Maybe pause job?
            // For now, skip
            continue;
        }

        const plan = sub.plan;
        const jobValidityDays = plan.features.jobValidityDays;

        const ageDays = Math.floor((Date.now() - job.createdAt) / (1000 * 60 * 60 * 24));

        if (ageDays > jobValidityDays) {
            console.log(`Pausing job ${job._id} (Age: ${ageDays} days, Limit: ${jobValidityDays} days)`);
            job.status = 'paused';
            await job.save();
            pausedCount++;
        }
    }
    console.log(`Job expiry check complete. Paused ${pausedCount} jobs.`);
};

// Connect to DB and run
const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        await pauseExpiredJobs();
        process.exit(0);
    } catch (error) {
        console.error('Error running pauseExpiredJobs:', error);
        process.exit(1);
    }
};

run();
