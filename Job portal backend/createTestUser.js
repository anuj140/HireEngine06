const mongoose = require("mongoose");
const User = require("./models/User");
const { generateToken } = require("./utils/generateToken");
const fs = require('fs');
require("dotenv").config();

const createTestUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const email = "testuser@example.com";
        const password = "password123";
        const phone = "+1234567890";

        let user = await User.findOne({ email });
        if (!user) {
            console.log("Creating new user...");
            user = await User.create({
                name: "Test User",
                email,
                password, // Model should hash this
                phone,
                phoneVerified: true,
                emailVerified: true,
                role: "user"
            });
        } else {
            console.log("User already exists.");
            // Update password just in case
            user.password = password;
            await user.save();
        }

        const token = generateToken(user._id, user.role);
        console.log("TOKEN:", token);
        fs.writeFileSync('token.txt', token);

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

createTestUser();
