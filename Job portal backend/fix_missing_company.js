const mongoose = require('mongoose');
const Job = require('./models/Job');
require('dotenv').config();

const fixMissingCompany = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const jobs = await Job.find({ company: { $exists: false } });
        console.log(`Found ${jobs.length} jobs with missing company field.`);

        let updatedCount = 0;
        for (const job of jobs) {
            if (job.postedBy) {
                job.company = job.postedBy;

                // Fix expiryDate
                if (!job.expiryDate) {
                    const created = job.createdAt || new Date();
                    job.expiryDate = new Date(created.getTime() + 30 * 24 * 60 * 60 * 1000);
                }

                // Fix workMode
                if (!job.workMode) {
                    job.workMode = 'On-site';
                }

                // Fix jobType if needed
                const validJobTypes = ["Full-time", "Part-time", "Contract", "Internship"];
                if (!validJobTypes.includes(job.jobType)) {
                    job.jobType = "Full-time";
                }

                // Fix questions
                if (job.questions && job.questions.length > 0) {
                    job.questions.forEach(q => {
                        if (q.type !== 'text' && q.type !== 'boolean') {
                            q.type = 'text';
                        }
                    });
                }

                await job.save();
                updatedCount++;
            }
        }

        console.log(`Successfully updated ${updatedCount} jobs.`);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        if (error.errors) {
            Object.keys(error.errors).forEach(key => {
                console.error(`Validation Error [${key}]: ${error.errors[key].message}`);
            });
        }
        process.exit(1);
    }
};

fixMissingCompany();
