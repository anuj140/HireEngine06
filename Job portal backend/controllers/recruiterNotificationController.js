const Notification = require("../models/Notification");
const mongoose = require("mongoose");
/**
 * Create a notification for recruiter (used internally)
 * @param {Object} notificationData
 * @returns {Promise<Notification>}
 */
exports.createRecruiterNotification = async (notificationData) => {
  try {
    // Set recruiter-specific defaults if not provided
    const notification = await Notification.create({
      ...notificationData,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    });
    return notification;
  } catch (error) {
    console.error("Error creating recruiter notification:", error);
    throw error;
  }
};

/**
 * Create notification for new job application
 * @param {String} recruiterId - Recruiter ID
 * @param {String} jobId - Job ID
 * @param {String} applicationId - Application ID
 * @param {String} applicantName - Applicant name
 * @param {String} jobTitle - Job title
 */
//* When user apply for job (user-side) call this controller function
exports.createNewApplicationNotification = async (
  recruiterId,
  jobId,
  applicationId,
  applicantName,
  jobTitle
) => {
  const title = "New Application Received";
  const message = `${applicantName} applied for your job: ${jobTitle}`;

  return await this.createRecruiterNotification({
    user: recruiterId,
    type: "new_application",
    title,
    message,
    data: {
      jobId,
      applicationId,
      applicantName,
      jobTitle,
      metadata: {
        action: "review_application",
        priority: "new",
      },
    },
    priority: "high",
  });
};

/**
 * Create notification for application withdrawal
 * @param {String} recruiterId - Recruiter ID
 * @param {String} jobId - Job ID
 * @param {String} applicantName - Applicant name
 * @param {String} jobTitle - Job title
 */
//* When user withdraw application (user-side)
// ✅
exports.createApplicationWithdrawalNotification = async (
  recruiterId, // application.job.company._id
  jobId, // application.job._id
  applicantName, // application.applicant.name
  jobTitle // application.job.title
) => {
  const title = "Application Withdrawn";
  const message = `${applicantName} withdrew their application for ${jobTitle}`;

  return await this.createRecruiterNotification({
    user: recruiterId,
    type: "application_withdrawal",
    title,
    message,
    data: {
      jobId,
      applicantName,
      jobTitle,
      metadata: {
        action: "view_job",
        timestamp: new Date().toISOString(),
      },
    },
    priority: "medium",
  });
};

/**
 * Create subscription expiry notification
 * @param {String} recruiterId - Recruiter ID
 * @param {String} planName - Subscription plan name
 * @param {Date} expiryDate - Expiry date
 * @param {Number} daysRemaining - Days remaining
 */
exports.createSubscriptionExpiryNotification = async (
  recruiterId,
  planName,
  expiryDate,
  daysRemaining
) => {
  const title = "Subscription Expiring Soon";
  let message = "";
  let priority = "medium";

  if (daysRemaining <= 3) {
    message = `Your ${planName} plan expires in ${daysRemaining} day(s)`;
    priority = "urgent";
  } else if (daysRemaining <= 7) {
    message = `Your ${planName} plan expires in ${daysRemaining} days`;
    priority = "high";
  } else {
    message = `Your ${planName} plan will expire on ${expiryDate.toLocaleDateString()}`;
  }

  return await this.createRecruiterNotification({
    user: recruiterId,
    type: "subscription_expiring",
    title,
    message,
    data: {
      planName,
      expiryDate,
      daysRemaining,
      metadata: {
        action: "renew_subscription",
        renewalLink: "/recruiter/dashboard/subscription",
      },
    },
    priority,
  });
};

/**
 * Create job limit reached notification
 * @param {String} recruiterId - Recruiter ID
 * @param {Number} currentLimit - Current limit
 * @param {Number} used - Number of jobs posted
 */
//* When recruiter create new job, then call this controller function
// ✅
exports.createJobLimitReachedNotification = async (recruiterId, currentLimit, used) => {
  const title = "Job Post Limit Reached";
  const message = `You've reached your monthly limit of ${currentLimit} job posts (${used}/${currentLimit} used)`;

  return await this.createRecruiterNotification({
    user: recruiterId,
    type: "job_limit_reached",
    title,
    message,
    data: {
      currentLimit,
      used,
      metadata: {
        action: "upgrade_plan",
        upgradeLink: "/recruiter/dashboard/subscription/upgrade",
      },
    },
    priority: "urgent",
  });
};

/**
 * Create company verification notification
 * @param {String} recruiterId - Recruiter ID
 * @param {String} status - Verification status
 * @param {String} notes - Admin notes (optional)
 */
//* Call this controller function when admin reject company (don't know about company verified and verification pending)
exports.createVerificationNotification = async (recruiterId, status, notes = "") => {
  const statusMap = {
    verified: {
      title: "Company Verified!",
      message: "Your company profile has been verified successfully.",
    },
    rejected: {
      title: "Verification Rejected",
      message: "Your company verification request was rejected.",
    },
    pending: {
      title: "Verification Pending",
      message: "Your company verification is under review.",
    },
  };

  const { title, message } = statusMap[status] || {
    title: "Verification Update",
    message: "Your verification status has been updated.",
  };

  const fullMessage = notes ? `${message} Note: ${notes}` : message;

  return await this.createRecruiterNotification({
    user: recruiterId,
    type: "profile_verification",
    title,
    message: fullMessage,
    data: {
      status,
      notes,
      verifiedAt: status === "verified" ? new Date() : null,
      metadata: {
        action: status === "rejected" ? "update_profile" : "view_profile",
      },
    },
    priority: status === "verified" ? "high" : "medium",
  });
};

/**
 * Create team invitation notification
 * @param {String} recruiterId - Recruiter ID (who receives the invitation)
 * @param {String} inviterName - Name of person who invited
 * @param {String} companyName - Company name
 * @param {String} role - Assigned role
 * @param {String} invitationId - Invitation ID
 */
exports.createTeamInvitationNotification = async (
  recruiterId,
  inviterName,
  companyName,
  role,
  invitationId
) => {
  const title = "Team Invitation";
  const message = `${inviterName} invited you to join ${companyName} as ${role}`;

  return await this.createRecruiterNotification({
    user: recruiterId,
    type: "team_invitation",
    title,
    message,
    data: {
      inviterName,
      companyName,
      role,
      invitationId,
      metadata: {
        action: "view_invitation",
        acceptLink: `/recruiter/invitations/${invitationId}/accept`,
        declineLink: `/recruiter/invitations/${invitationId}/decline`,
      },
    },
    priority: "high",
  });
};

/**
 * Create interview reminder notification
 * @param {String} recruiterId - Recruiter ID
 * @param {String} candidateName - Candidate name
 * @param {String} jobTitle - Job title
 * @param {Date} interviewTime - Interview date/time
 * @param {String} interviewType - virtual/in-person
 * @param {String} meetingLink - Meeting link (for virtual)
 */
exports.createInterviewReminderNotification = async (
  recruiterId,
  candidateName,
  jobTitle,
  interviewTime,
  interviewType = "virtual",
  meetingLink = ""
) => {
  const formattedTime = interviewTime.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const title = "Interview Reminder";
  const message = `Interview with ${candidateName} for ${jobTitle} at ${formattedTime}`;

  return await this.createRecruiterNotification({
    user: recruiterId,
    type: "interview_reminder",
    title,
    message,
    data: {
      candidateName,
      jobTitle,
      interviewTime,
      interviewType,
      meetingLink,
      metadata: {
        action: "join_interview",
        joinLink: meetingLink,
        timeRemaining: Math.round((interviewTime - new Date()) / (1000 * 60)), // minutes remaining
      },
    },
    priority: "urgent",
  });
};

/**
 * Create bulk notifications for multiple new applications
 * @param {String} recruiterId - Recruiter ID
 * @param {Number} count - Number of new applications
 * @param {String} jobTitle - Job title (if specific to one job)
 */
// ✅
exports.createBulkApplicationsNotification = async (
  recruiterId,
  count,
  jobTitle = null
) => {
  const title = "New Applications";
  const message = jobTitle
    ? `You have ${count} new applications for "${jobTitle}"`
    : `You have ${count} new applications across your jobs`;

  return await this.createRecruiterNotification({
    user: recruiterId,
    type: "new_application",
    title,
    message,
    data: {
      count,
      jobTitle,
      metadata: {
        action: "view_applications",
        viewLink: "/recruiter/dashboard/applications",
      },
    },
    priority: "medium",
  });
};

/**
 * Create payment success notification
 * @param {String} recruiterId - Recruiter ID
 * @param {Number} amount - Payment amount
 * @param {String} planName - Plan name
 * @param {String} invoiceNumber - Invoice number
 */
// ✅
exports.createPaymentSuccessNotification = async (
  recruiterId, // recruiterId
  amount, // subscription.payment.amount
  planName, // plan.name
  invoiceNumber
) => {
  const title = "Payment Successful";
  const message = `Payment of ₹${amount} for ${planName} plan completed successfully. Invoice: ${invoiceNumber}`;

  return await this.createRecruiterNotification({
    user: recruiterId,
    type: "payment_success",
    title,
    message,
    data: {
      amount,
      planName,
      invoiceNumber,
      metadata: {
        action: "view_invoice",
        invoiceLink: `/recruiter/dashboard/invoices/${invoiceNumber}`,
      },
    },
    priority: "medium",
  });
};

/**
 * Create analytics notification (weekly/monthly summary)
 * @param {String} recruiterId - Recruiter ID
 * @param {Object} stats - Statistics object
 * @param {String} period - weekly/monthly
 */

exports.createAnalyticsNotification = async (recruiterId, stats, period = "weekly") => {
  const title = `${period.charAt(0).toUpperCase() + period.slice(1)} Analytics Summary`;
  const message = `Your jobs received ${stats.applications || 0} new applications, ${
    stats.views || 0
  } views, and ${stats.interviews || 0} interviews scheduled.`;

  return await this.createRecruiterNotification({
    user: recruiterId,
    type: "job_analytics",
    title,
    message,
    data: {
      period,
      stats,
      metadata: {
        action: "view_analytics",
        analyticsLink: "/recruiter/dashboard/analytics",
      },
    },
    priority: "low",
  });
};

// ==================== RECRUITER NOTIFICATION ENDPOINTS ====================

/**
 * Get all notifications for authenticated recruiter
 * @route GET /api/recruiter/notifications
 */
exports.getRecruiterNotifications = async (req, res) => {
  try {
    const recruiterId = req.user.id;
    const { page = 1, limit = 20, type, priority, unreadOnly = false } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = { user: recruiterId };

    if (unreadOnly === "true") {
      query.isRead = false;
    }

    if (type && type !== "all") {
      query.type = type;
    }

    if (priority && priority !== "all") {
      query.priority = priority;
    }

    // Get notifications with pagination
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      user: recruiterId,
      isRead: false,
    });

    // Format notifications
    const formattedNotifications = notifications.map((notif) => ({
      ...notif,
      id: notif._id,
      formattedDate: new Date(notif.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year:
          notif.createdAt.getFullYear() !== new Date().getFullYear()
            ? "numeric"
            : undefined,
        hour: "numeric",
        minute: "2-digit",
      }),
      timeAgo: getTimeAgo(notif.createdAt),
    }));

   let objId = new mongoose.Types.ObjectId(recruiterId)

    // Get counts by type
    const typeCounts = await Notification.aggregate([
      { $match: { user: objId } },
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      success: true,
      notifications: formattedNotifications,
      counts: {
        total,
        unread: unreadCount,
        byType: typeCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1,
      },
    });
  } catch (error) {
    console.error("Get recruiter notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
    });
  }
};

/**
 * Mark recruiter notification as read
 * @route PUT /api/recruiter/notifications/:id/read
 */
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const recruiterId = req.user.id;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: recruiterId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    // Get updated unread count
    const unreadCount = await Notification.countDocuments({
      user: recruiterId,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      notification,
      unreadCount,
    });
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
    });
  }
};

/**
 * Mark all recruiter notifications as read
 * @route PUT /api/recruiter/notifications/read-all
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const recruiterId = req.user.id;

    const result = await Notification.updateMany(
      { user: recruiterId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.status(200).json({
      success: true,
      message: `Marked ${result.modifiedCount} notifications as read`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Mark all as read error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read",
    });
  }
};

/**
 * Delete a single recruiter notification
 * @route DELETE /api/recruiter/notifications/:id
 */
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const recruiterId = req.user.id;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      user: recruiterId,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    // Get updated counts
    const [unreadCount, totalCount] = await Promise.all([
      Notification.countDocuments({ user: recruiterId, isRead: false }),
      Notification.countDocuments({ user: recruiterId }),
    ]);

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
      counts: {
        unread: unreadCount,
        total: totalCount,
      },
    });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete notification",
    });
  }
};

/**
 * Clear all recruiter notifications
 * @route DELETE /api/recruiter/notifications
 */
exports.clearAllNotifications = async (req, res) => {
  try {
    const recruiterId = req.user.id;

    const result = await Notification.deleteMany({ user: recruiterId });

    res.status(200).json({
      success: true,
      message: `Cleared ${result.deletedCount} notifications`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Clear all notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear all notifications",
    });
  }
};

/**
 * Get recruiter notification stats
 * @route GET /api/recruiter/notifications/stats
 */
exports.getNotificationStats = async (req, res) => {
  try {
    const recruiterId = req.user.id;

    const [
      totalCount,
      unreadCount,
      todayCount,
      applicationNotifications,
      subscriptionNotifications,
      highPriorityCount,
    ] = await Promise.all([
      Notification.countDocuments({ user: recruiterId }),
      Notification.countDocuments({ user: recruiterId, isRead: false }),
      Notification.countDocuments({
        user: recruiterId,
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }),
      Notification.countDocuments({
        user: recruiterId,
        type: { $in: ["new_application", "application_withdrawal"] },
      }),
      Notification.countDocuments({
        user: recruiterId,
        type: {
          $in: [
            "subscription_expiring",
            "job_limit_reached",
            "payment_success",
            "payment_failed",
          ],
        },
      }),
      Notification.countDocuments({
        user: recruiterId,
        priority: { $in: ["high", "urgent"] },
        isRead: false,
      }),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        total: totalCount,
        unread: unreadCount,
        today: todayCount,
        applications: applicationNotifications,
        subscription: subscriptionNotifications,
        highPriority: highPriorityCount,
      },
    });
  } catch (error) {
    console.error("Get notification stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get notification stats",
    });
  }
};

/**
 * Get notification preferences (simplified - extend as needed)
 * @route GET /api/recruiter/notifications/preferences
 */
exports.getNotificationPreferences = async (req, res) => {
  try {
    const recruiterId = req.user.id;

    // In a real app, you'd have a separate NotificationPreferences model
    // For now, return defaults
    const preferences = {
      emailNotifications: {
        newApplications: true,
        applicationUpdates: true,
        interviewReminders: true,
        subscriptionAlerts: true,
        companyReviews: true,
        weeklyDigest: true,
      },
      pushNotifications: {
        newApplications: true,
        interviewReminders: true,
        urgentAlerts: true,
      },
      frequency: {
        digest: "weekly", // daily, weekly, monthly
        quietHours: {
          enabled: false,
          start: "22:00",
          end: "08:00",
        },
      },
    };

    res.status(200).json({
      success: true,
      preferences,
    });
  } catch (error) {
    console.error("Get preferences error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get notification preferences",
    });
  }
};

// Helper function for time ago
function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
