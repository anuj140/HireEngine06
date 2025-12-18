
require("dotenv").config();
require("express-async-errors");

const path = require("path");
// extra security packages
const helmet = require("helmet");
const xss = require("xss-clean");

const express = require("express");
const app = express();

const connectDB = require("./db/connect");
// routers
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const jobRoutes = require("./routes/jobRoutes");
const recruiterRoutes = require("./routes/recruiterRoutes");
const authRoutes = require("./routes/auth");
const recruiterRequestRoutes = require("./routes/recruiterRequestRoutes");
const emailTemplatesRoutes = require("./routes/emailTemplateRoutes");
const teamRoutes = require("./routes/teamRoutes");
const recruiterJobRoutes = require('./routes/recruiterJobRoutes');
const adminUserRoutes = require("./routes/adminUserRoutes");
const adminDashboardRoutes = require("./routes/adminDashboardRoutes");
// New routes
const adminCmsRoutes = require("./routes/adminCmsRoutes");
const publicCmsRoutes = require("./routes/cmsRoutes");
const jobAlertRoutes = require("./routes/jobAlertRoutes");
const messageRoutes = require("./routes/messageRoutes");
const adminCompanyRoutes = require("./routes/adminCompanyRoutes");
const adminJobRoutes = require("./routes/adminJobRoutes");
const recruiterAnalyticsRoutes = require("./routes/recruiterAnalyticsRoutes");

const { authMiddleware, authorize } = require("./middleware/authentication");


// error handler
const errorHandlerMiddleware = require("./middleware/error-handler");
const notFoundMiddleware = require("./middleware/not-found");

app.use(express.json());
app.use(helmet());
app.use(xss());

// routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/jobs", jobRoutes);
app.use('/api/v1/user/alerts', authMiddleware, authorize('user'), jobAlertRoutes);
app.use('/api/v1/messages', authMiddleware, authorize('user', 'recruiter', 'team_member'), messageRoutes);
app.use("/api/v1/cms", publicCmsRoutes);

// --- Recruiter Routes (Order is important) ---
app.use("/api/v1/recruiter/team", teamRoutes);
app.use("/api/v1/recruiter/jobs", recruiterJobRoutes);
app.use('/api/v1/recruiter/analytics', authMiddleware, authorize('recruiter', 'team_member'), recruiterAnalyticsRoutes);
app.use("/api/v1/recruiter-request", recruiterRequestRoutes);
app.use("/api/v1/recruiter", recruiterRoutes); // General recruiter routes last


// Admin Routes
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/admin/email-templates", emailTemplatesRoutes);
app.use("/api/v1/admin/users", adminUserRoutes);
app.use("/api/v1/admin/companies", adminCompanyRoutes);
app.use("/api/v1/admin/jobs", adminJobRoutes);
app.use("/api/v1/admin/dashboard", adminDashboardRoutes);
app.use("/api/v1/admin/cms", adminCmsRoutes);


app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 5001;

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(port, () => console.log(`Server is listening on port ${port}...`));
  } catch (error) {
    console.log(error);
  }
};

start();