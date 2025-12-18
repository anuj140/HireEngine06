const mongoose = require("mongoose");
const Recruiter = require("./models/Recruiter");
const { generateToken } = require("./utils/generateToken");
const fs = require('fs');
require("dotenv").config();

const createTestCompany = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const email = "company@example.com";
        const password = "password123";
        const companyName = "Test Company";

        let recruiter = await Recruiter.findOne({ email });
        if (!recruiter) {
            console.log("Creating new company...");
            recruiter = await Recruiter.create({
                name: "Test Recruiter",
                email,
                password, // Model should hash this
                companyName,
                role: "recruiter",
                phone: "9876543210",
                status: "approved" // Auto-approve for testing
            });
        } else {
            console.log("Company already exists.");
            recruiter.password = password;
            recruiter.status = "approved";
            await recruiter.save();
        }

        const token = generateToken(recruiter._id, recruiter.role);
        console.log("TOKEN:", token);
        fs.writeFileSync('company_token.txt', token);

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

createTestCompany();
