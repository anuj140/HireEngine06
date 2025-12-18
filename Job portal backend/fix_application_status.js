const mongoose = require('mongoose');
const Application = require('./models/Application');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

const fixStatuses = async () => {
    await connectDB();

    const statusMap = {
        "new": "New",
        "reviewed": "Reviewed",
        "shortlisted": "Shortlisted",
        "interview": "Interview Scheduled",
        "scheduled": "Interview Scheduled",
        "hired": "Hired",
        "rejected": "Rejected",
        "applied": "New", // Handle legacy "applied" if any
        "viewed": "Reviewed", // Handle legacy "viewed" if any
        "selected": "Hired" // Handle legacy "selected" if any
    };

    try {
        const applications = await Application.find({});
        console.log(`Found ${applications.length} applications.`);

        let updatedCount = 0;

        for (const app of applications) {
            if (statusMap[app.status]) {
                app.status = statusMap[app.status];
                await app.save();
                updatedCount++;
                console.log(`Updated application ${app._id} status to ${app.status}`);
            } else if (!Object.values(statusMap).includes(app.status)) {
                // If status is not in map and not already Title Case (roughly), log it
                console.warn(`Unknown status for application ${app._id}: ${app.status}`);
            }
        }

        console.log(`Migration complete. Updated ${updatedCount} applications.`);
    } catch (err) {
        console.error('Migration error:', err);
    } finally {
        mongoose.connection.close();
    }
};

fixStatuses();
