
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const verifyNewUser = async () => {
    try {
        const dbUrl = process.env.MONGO_URI || "mongodb://localhost:27017/hireEngine";
        await mongoose.connect(dbUrl);
        console.log("Connected to DB.");

        // 1. Get current count of "New Users" (last 30 days)
        const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const initialCount = await User.countDocuments({ createdAt: { $gte: last30Days } });
        console.log(`Initial New Users (30d): ${initialCount}`);

        // 2. Create a dummy new user
        const newUser = new User({
            name: "Test NewUser " + Date.now(),
            email: `testnewuser${Date.now()}@example.com`,
            password: "password123",
            role: "JobSeeker", // or 'user'
            isActive: true
        });
        await newUser.save();
        console.log(`Created new user: ${newUser.email}`);

        // 3. Get new count
        const newCount = await User.countDocuments({ createdAt: { $gte: last30Days } });
        console.log(`Updated New Users (30d): ${newCount}`);

        if (newCount === initialCount + 1) {
            console.log("SUCCESS: New user is counted correctly.");
        } else {
            console.error("FAILURE: New user count did not increment.");
        }

        // Cleanup
        await User.findByIdAndDelete(newUser._id);
        console.log("Cleaned up test user.");

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
};

verifyNewUser();
