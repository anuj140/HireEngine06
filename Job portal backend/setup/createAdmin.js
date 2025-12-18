
const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const createAdminUser = async () => {
  try {
    // Check if any admin exists
    const adminCount = await Admin.countDocuments();
    
    if (adminCount === 0) {
      console.log("No admin found. Creating default admin...");
      
      const email = process.env.ADMIN_EMAIL || "admin@example.com";
      const password = process.env.ADMIN_PASSWORD || "admin123";
      const name = "Super Admin";

      // The Admin model pre-save hook handles hashing, but if we create directly:
      const admin = await Admin.create({
        name,
        email,
        password, // Will be hashed by pre-save hook in Admin model
        role: "Admin"
      });

      console.log(`✅ Admin created successfully: ${email}`);
    } else {
      console.log("✅ Admin account already exists.");
    }
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
  }
};

module.exports = createAdminUser;
