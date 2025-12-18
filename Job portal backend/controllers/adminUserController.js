const User = require("../models/User");
const Recruiter = require("../models/Recruiter");
const TeamMember = require("../models/TeamMember");
const Admin = require("../models/Admin");
const Application = require("../models/Application");
const Report = require("../models/Report");
const sendEmail = require("../utils/sendEmail");
const bcrypt = require("bcryptjs");

// Utility: Get date range
function getDateRange(filter) {
  const now = new Date();
  switch (filter) {
    case "7d": return new Date(now.setDate(now.getDate() - 7));
    case "30d": return new Date(now.setDate(now.getDate() - 30));
    case "1y": return new Date(now.setFullYear(now.getFullYear() - 1));
    default: return null; // all time
  }
}

// ---------- GET STATS (summary + charts) ----------
exports.getUserManagementStats = async (req, res) => {
  try {
    const filter = req.query.range || "all"; // 7d | 30d | 1y | all
    const startDate = getDateRange(filter);

    // --- Combined collections ---
    const userQuery = startDate ? { createdAt: { $gte: startDate } } : {};
    const recruiterQuery = startDate ? { createdAt: { $gte: startDate } } : {};
    const teamQuery = startDate ? { createdAt: { $gte: startDate } } : {};
    const adminQuery = startDate ? { createdAt: { $gte: startDate } } : {};

    const [users, recruiters, teams, admins] = await Promise.all([
      User.find(userQuery, "isActive createdAt"),
      Recruiter.find(recruiterQuery, "isActive createdAt"),
      TeamMember.find(teamQuery, "status createdAt"),
      Admin.find(adminQuery, "createdAt"),
    ]);

    const totalUsers = users.length + recruiters.length + teams.length + admins.length;
    const activeUsers = users.filter(u => u.isActive).length + recruiters.filter(r => r.isActive).length;
    const blockedUsers = users.filter(u => !u.isActive).length + recruiters.filter(r => !r.isActive).length;

    // --- New users in past 30 days ---
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newUsers = users.filter(u => u.createdAt >= last30Days).length
      + recruiters.filter(r => r.createdAt >= last30Days).length
      + teams.filter(t => t.createdAt >= last30Days).length;

    // --- Pie Chart: Role Distribution ---
    const roleDistribution = {
      job_seekers: users.length,
      recruiters: recruiters.length,
      team_members: teams.length,
      admins: admins.length,
    };

    // --- Status breakdown ---
    const statusBreakdown = {
      active: activeUsers,
      blocked: blockedUsers,
      total: totalUsers,
    };

    res.status(200).json({
      success: true,
      filter,
      stats: {
        totalUsers,
        activeUsers,
        newUsers,
        roleDistribution,
        statusBreakdown,
      },
    });
  } catch (err) {
    console.error("User stats error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch user stats" });
  }
};

// ---------- GET USER LIST ----------
exports.getAllUsersList = async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;

    // Determine date query
    let dateQuery = {};
    if (range) {
      const start = getDateRange(range);
      if (start) dateQuery = { createdAt: { $gte: start } };
    } else if (startDate && endDate) {
      dateQuery = { createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) } };
    }

    const [users, recruiters] = await Promise.all([
      User.find(dateQuery).select("name email profilePhoto isActive role createdAt").lean(),
      Recruiter.find(dateQuery).select("name email isActive role createdAt").lean(),
    ]);

    // Normalize for UI
    const combined = [
      ...users.map(u => ({
        _id: u._id,
        id: u._id,
        name: u.name,
        email: u.email,
        profilePhoto: u.profilePhoto || null,
        role: "Job Seeker",
        status: u.isActive ? "Active" : "Blocked",
        registeredAt: u.createdAt,
      })),
      ...recruiters.map(r => ({
        _id: r._id,
        id: r._id,
        name: r.name,
        email: r.email,
        profilePhoto: null,
        role: "Recruiter",
        status: r.isActive ? "Active" : "Blocked",
        registeredAt: r.createdAt,
      })),
    ];

    // Sort newest first
    combined.sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt));

    res.status(200).json({
      success: true,
      count: combined.length,
      users: combined,
    });
  } catch (err) {
    console.error("Get all users error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
};

exports.getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    // 1. Try finding in Users collection
    let user = await User.findById(userId)
      .select("-password")
      .populate({
        path: 'appliedJobs.job',
        select: 'title companyName'
      })
      .lean();

    let userType = 'user';

    // 2. If not found, try Recruiters collection
    if (!user) {
      user = await Recruiter.findById(userId)
        .select("-password")
        .populate({
          path: 'jobsPosted',
          select: 'title status createdAt'
        })
        .lean();
      userType = 'recruiter';
    }

    if (!user) return res.status(404).json({ message: "User not found" });

    // --- Basic Stats & Activity ---
    let activity = {};

    if (userType === 'user') {
      const applicationsList = await Application.find({ applicant: userId })
        .populate({
          path: 'job',
          select: 'title companyName company',
          populate: { path: 'company', select: 'companyName' } // Fallback to recruiter name
        })
        .sort({ appliedAt: -1 })
        .lean();

      const appCount = applicationsList.length;
      const savedJobs = user.bookmarks?.length || 0;
      const interviews = applicationsList.filter(app => app.status === 'interview').length;
      const profileViews = 0; // Tracking not yet implemented

      activity = {
        applications: appCount,
        savedJobs,
        profileViews,
        interviews,
      };

      // Normalize appliedJobs for frontend using REAL Application data
      user.appliedJobs = applicationsList.map(app => ({
        job: {
          title: app.job?.title || 'Unknown Job',
          companyName: app.job?.companyName || app.job?.company?.companyName || 'Unknown Company'
        },
        appliedAt: app.appliedAt || app.createdAt,
        status: app.status
      }));
    } else {
      // Recruiter Stats
      const Job = require("../models/Job");
      const jobsList = await Job.find({ company: userId }).select('title status createdAt').lean();

      activity = {
        applications: jobsList.length, // Reusing field name for "Primary Count" (Jobs Posted)
        savedJobs: 0,
        profileViews: 0,
        interviews: 0
      };

      // Normalize posted jobs
      if (jobsList) {
        user.appliedJobs = jobsList.map(job => ({
          job: { title: job.title, companyName: user.companyName },
          appliedAt: job.createdAt,
          status: job.status
        }));
      }
    }

    const reports = await Report.find({ reportedBy: userId }).select("message createdAt").lean();

    // --- Response ---
    res.status(200).json({
      success: true,
      user: {
        ...user,
        // Ensure role exists
        role: user.role || (userType === 'recruiter' ? 'Recruiter' : 'Job Seeker'),
        // Recruiters might use companyName as name if name is missing?
        name: user.name || user.companyName,
        profile: user.profile || { about: user.about, location: user.location } // Map Recruiter fields to profile
      },
      activity,
      reports,
      adminNotes: user.adminNotes || "",
    });
  } catch (err) {
    console.error("getUserDetails error:", err);
    res.status(500).json({ message: "Failed to fetch user details" });
  }
};

// --- BLOCK / UNBLOCK USER ---
exports.blockOrUnblockUser = async (req, res) => {
  const { userId } = req.params;
  const { action } = req.body; // "block" or "unblock"
  const isActive = action === "unblock";

  const user = await User.findByIdAndUpdate(userId, { isActive }, { new: true });
  if (!user) return res.status(404).json({ message: "User not found" });

  res.json({
    success: true,
    message: `User has been ${isActive ? "unblocked" : "blocked"} successfully.`,
  });
};

// --- DELETE USER ---
exports.deleteUserAccount = async (req, res) => {
  const { userId } = req.params;
  await User.findByIdAndDelete(userId);
  await Application.deleteMany({ applicant: userId });
  res.json({ success: true, message: "User account deleted successfully." });
};

// --- RESET PASSWORD ---
exports.resetUserPassword = async (req, res) => {
  const { userId } = req.params;
  const tempPassword = Math.random().toString(36).slice(-8);
  const hashed = await bcrypt.hash(tempPassword, 10);

  const user = await User.findByIdAndUpdate(userId, { password: hashed }, { new: true });
  if (!user) return res.status(404).json({ message: "User not found" });

  await sendEmail({
    to: user.email,
    template: "reset_password_admin",
    variables: { name: user.name, tempPassword },
  });
  res.json({ success: true, message: "Password reset and emailed to user." });
};

// --- SEND MESSAGE (ADMIN → USER) ---
exports.sendMessageToUser = async (req, res) => {
  const { userId } = req.params;
  const { subject, message } = req.body;

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  await sendEmail({
    to: user.email,
    template: "admin_message",
    variables: { name: user.name, message, subject },
  });

  res.json({ success: true, message: "Message sent successfully." });
};

// --- UPDATE USER DETAILS ---
exports.updateUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    // Prevent updating sensitive fields directly
    delete updates.password;
    delete updates._id;

    const user = await User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User details updated successfully",
      user,
    });
  } catch (error) {
    console.error("Error updating user details:", error);
    res.status(500).json({ success: false, message: "Failed to update user details" });
  }
};