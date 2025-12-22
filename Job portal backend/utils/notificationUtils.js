// utils/notificationUtils.js
const Notification = require("../models/Notification");
const recruiterNotificationController = require("../controllers/recruiterNotificationController");

/**
 * Check and send subscription expiry notifications
 * Runs daily via cron job
 */
exports.checkSubscriptionExpiry = async () => {
  try {
    const Subscription = require("../models/Subscription");
    const Recruiter = require("../models/Recruiter");

    // Find subscriptions expiring in next 7 days
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const expiringSubscriptions = await Subscription.find({
      status: "active",
      endDate: {
        $gte: new Date(),
        $lte: sevenDaysFromNow,
      },
    }).populate("plan");

    for (const subscription of expiringSubscriptions) {
      const daysRemaining = Math.ceil(
        (subscription.endDate - new Date()) / (1000 * 60 * 60 * 24)
      );

      // Only send notifications at specific intervals
      if ([1, 3, 7].includes(daysRemaining)) {
        await recruiterNotificationController.createSubscriptionExpiryNotification(
          subscription.recruiterId,
          subscription.plan.displayName,
          subscription.endDate,
          daysRemaining
        );

        console.log(
          `Sent expiry notification to recruiter ${subscription.recruiterId}, ${daysRemaining} days remaining`
        );
      }
    }

    return { processed: expiringSubscriptions.length };
  } catch (error) {
    console.error("Error checking subscription expiry:", error);
    throw error;
  }
};

/**
 * Send daily digest to recruiters
 * Runs daily via cron job
 */
exports.sendDailyDigest = async () => {
  try {
    const Recruiter = require("../models/Recruiter");
    const Application = require("../models/Application");
    const Job = require("../models/Job");

    const recruiters = await Recruiter.find({ isActive: true });

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const recruiter of recruiters) {
      // Get yesterday's stats - FIXED: Use 'job' field not 'jobId'
      const [newApplications, totalJobs, activeJobs] = await Promise.all([
        Application.countDocuments({
          job: { $in: recruiter.jobsPosted || [] }, // FIXED: 'job' not 'jobId'
          appliedAt: { $gte: yesterday, $lt: today }, // FIXED: 'appliedAt' not 'createdAt'
        }),
        Job.countDocuments({ postedBy: recruiter._id }),
        Job.countDocuments({
          postedBy: recruiter._id,
          status: "active",
        }),
      ]);

      if (newApplications > 0) {
        await recruiterNotificationController.createAnalyticsNotification(
          recruiter._id,
          {
            applications: newApplications,
            totalJobs,
            activeJobs,
          },
          "daily"
        );
      }
    }

    return { sent: recruiters.length };
  } catch (error) {
    console.error("Error sending daily digest:", error);
    throw error;
  }
};

/**
 * Send interview reminders
 * Runs every hour via cron job
 */
exports.sendInterviewReminders = async () => {
  try {
    // Assuming you have an Interview model
    // const Interview = require("../models/Interview");

    // const oneHourFromNow = new Date();
    // oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);

    // const interviews = await Interview.find({
    //   scheduledAt: {
    //     $gte: new Date(),
    //     $lte: oneHourFromNow
    //   },
    //   reminderSent: false,
    //   status: "scheduled"
    // }).populate("jobId candidateId");

    // for (const interview of interviews) {
    //   await recruiterNotificationController.createInterviewReminderNotification(
    //     interview.jobId.postedBy, // recruiter ID
    //     interview.candidateId.name,
    //     interview.jobId.title,
    //     interview.scheduledAt,
    //     interview.type,
    //     interview.meetingLink
    //   );

    //   interview.reminderSent = true;
    //   await interview.save();
    // }

    // return { remindersSent: interviews.length };
    return { remindersSent: 0 }; // Placeholder
  } catch (error) {
    console.error("Error sending interview reminders:", error);
    throw error;
  }
};

/**
 * Clean up old notifications
 * Runs weekly via cron job
 */
exports.cleanupOldNotifications = async () => {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const result = await Notification.deleteMany({
      createdAt: { $lt: ninetyDaysAgo },
      isRead: true,
      priority: { $in: ["low", "medium"] },
    });

    return { deleted: result.deletedCount };
  } catch (error) {
    console.error("Error cleaning up old notifications:", error);
    throw error;
  }
};
