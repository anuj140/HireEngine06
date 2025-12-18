require("dotenv").config();
require("express-async-errors");
const express = require("express");
const cors = require("cors");
const connectDB = require("./db/connect");
const createAdminUser = require("./setup/createAdmin");
const seedData = require("./setup/seedData");

// Middleware
const notFoundMiddleware = require("./middleware/not-found");
const errorHandlerMiddleware = require("./middleware/error-handler");
const { authMiddleware, authorize } = require("./middleware/authentication");

// Subscription Utils
const { initializeSubscriptionCronJobs } = require("./utils/subscriptionUtils");
const SubscriptionPlan = require("./models/SubscriptionPlanSchema");

// --- Routes Imports ---
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/userRoutes");
const jobRoutes = require("./routes/jobRoutes");
const cmsRoutes = require("./routes/cmsRoutes");
const recruiterRoutes = require("./routes/recruiterRoutes");
const recruiterRequestRoutes = require("./routes/recruiterRequestRoutes");
const recruiterJobRoutes = require("./routes/recruiterJobRoutes");
const teamRoutes = require("./routes/teamRoutes");
const messageRoutes = require("./routes/messageRoutes");
const jobAlertRoutes = require("./routes/jobAlertRoutes");
const recruiterAnalyticsRoutes = require("./routes/recruiterAnalyticsRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const notificationRoutes = require("./routes/notificationUserRoutes");

// Admin Routes
const adminRoutes = require("./routes/adminRoutes");
const adminUserRoutes = require("./routes/adminUserRoutes");
const adminCompanyRoutes = require("./routes/adminCompanyRoutes");
const adminJobRoutes = require("./routes/adminJobRoutes");
const adminCmsRoutes = require("./routes/adminCmsRoutes");
const adminDashboardRoutes = require("./routes/adminDashboardRoutes");
const adminCommunicationsRoutes = require("./routes/adminCommunicationsRoutes");
const emailTemplatesRoutes = require("./routes/emailTemplateRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

const app = express();

// --- Middleware Setup ---
app.use(cors());
app.use(express.json());

// --- Route Definitions ---

// Public & Auth
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/cms", cmsRoutes);
app.use("/api/v1/jobs", jobRoutes);

// User notifications
app.use("/api/v1/user/notifications", notificationRoutes);

// User Protected
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/user/alerts", authMiddleware, authorize("user"), jobAlertRoutes);

// Shared Protected (User + Recruiter)
app.use(
  "/api/v1/messages",
  authMiddleware,
  authorize("user", "recruiter", "team_member"),
  messageRoutes
);

// Recruiter & Team
app.use("/api/v1/recruiter-request", recruiterRequestRoutes);
app.use("/api/v1/recruiter", recruiterRoutes);
app.use("/api/v1/recruiter/jobs", recruiterJobRoutes);
app.use("/api/v1/recruiter/team", teamRoutes);
app.use("/api/v1/team", teamRoutes); // Direct team routes for public endpoints (login, accept invitation)
app.use(
  "/api/v1/recruiter/analytics",
  authMiddleware,
  authorize("recruiter", "team_member"),
  recruiterAnalyticsRoutes
);
// New Subscription Routes
app.use("/api/v1/subscriptions", subscriptionRoutes);

// Admin
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/admin/users", adminUserRoutes);
app.use("/api/v1/admin/companies", adminCompanyRoutes);
app.use("/api/v1/admin/jobs", adminJobRoutes);
app.use("/api/v1/admin/cms", adminCmsRoutes);
app.use("/api/v1/admin/dashboard", adminDashboardRoutes);
app.use("/api/v1/admin/communications", adminCommunicationsRoutes);
app.use("/api/v1/admin/email-templates", emailTemplatesRoutes);
app.use("/api/v1/admin/analytics", analyticsRoutes);

// Admin Analytics & Security
// app.use("/api/v1/admin/analytics", require("./api/routes/admin/analytics"));
// app.use("/api/v1/admin/communications", require("./api/routes/admin/communications"));
// app.use("/api/v1/admin/security", require("./api/routes/admin/security"));
// app.use("/api/v1/admin/monetization", require("./api/routes/admin/monetization"));

// --- Error Handling ---
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    // 1. Connect to DB
    console.log("Attempting to connect to MongoDB...");
    // const dbUrl = process.env.MONGO_URI || "";
    // console.log(
    //   "Using MongoDB URI:",
    //   dbUrl.includes("@") ? dbUrl.replace(/:[^:]*@/, ":****@") : dbUrl
    // );
    await connectDB(process.env.MONGO_URI); //* Don't comment out this line
    console.log("MongoDB Connected successfully!");

    // // 2. Run Seed/Setup scripts
    // await createAdminUser();
    // await seedData();

    // Seed subscription plans if they don't exist
    // try {
    //   await SubscriptionPlan.seedDefaultPlans();
    //   console.log("Subscription plans checked/seeded");
    // } catch (e) {
    //   console.error("Error seeding plans:", e.message);
    // }

    // // Initialize Cron Jobs
    // initializeSubscriptionCronJobs();

    // 3. Start Server
    app.listen(PORT, () => console.log(`Server is listening on port ${PORT}...`));
  } catch (error) {
    console.error("Failed to start server:");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    if (error.reason) {
      console.error("Error reason:", error.reason);
    }
    console.error("Full error:", error);
    process.exit(1);
  }
};

start();
