const mongoose = require('mongoose');
const Job = require('./models/Job');
require('dotenv').config();

const checkLatestJob = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const job = await Job.findOne().sort({ createdAt: -1 });

        if (!job) {
            console.log('No jobs found');
        } else {
            console.log('Latest Job Company:', job.company);
        }
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkLatestJob();
