const Notification = require("../models/Notification");

/**
 * Create a notification (used by other controllers)
 * @param {Object} notificationData - Notification data
 * @returns {Promise<Notification>} Created notification
 */
exports.createNotification = async (notificationData) => {
  try {
    const notification = await Notification.create(notificationData);
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

/**
 * Create application status change notification
 * @param {String} userId - User ID
 * @param {String} applicationId - Application ID
 * @param {String} oldStatus - Previous status
 * @param {String} newStatus - New status
 * @param {String} jobTitle - Job title
 * @param {String} companyName - Company name
 */
exports.createStatusChangeNotification = async (
  userId,
  applicationId,
  oldStatus,
  newStatus,
  jobTitle,
  companyName
) => {
  const statusMessages = {
    Reviewed: "Your application has been reviewed",
    Shortlisted: "Congratulations! You've been shortlisted",
    Interview_Scheduled: "Interview scheduled",
    Hired: "Congratulations! You've been hired",
    Rejected: "Update on your job application",
  };

  const priorityLevel = {
    Hired: "urgent",
    Interview_Scheduled: "high",
    Shortlisted: "medium",
    Rejected: "medium",
    Reviewed: "low",
  };

  const title = statusMessages[newStatus] || "Application status updated";
  const message = `Your application for "${jobTitle}" at ${companyName} has been updated from "${oldStatus}" to "${newStatus}".`;

  return await this.createNotification({
    user: userId,
    type: "application_status_change",
    title,
    message,
    data: {
      applicationId,
      oldStatus,
      newStatus,
      jobTitle,
      companyName,
    },
    priority: priorityLevel[newStatus] || "medium",
  });
};

// ==================== USER NOTIFICATION ENDPOINTS ====================

/**
 * Get all notifications for authenticated user
 * @route GET /api/users/notifications
 */
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = { user: userId };
    if (unreadOnly === "true") {
      query.isRead = false;
    }

    // Get notifications with pagination
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(); // Use lean for better performance

    // Get total count for pagination
    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      user: userId,
      isRead: false,
    });

    // Format notifications with virtual fields
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
    }));

    res.status(200).json({
      success: true,
      notifications: formattedNotifications,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1,
      },
      unreadCount,
    });
  } catch (error) {
    console.error("Get user notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
    });
  }
};

/**
 * Mark notification as read
 * @route PUT /api/users/notifications/:id/read
 */
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: userId },
      { isRead: true },
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
      user: userId,
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
 * Mark all notifications as read
 * @route PUT /api/users/notifications/read-all
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await Notification.updateMany(
      { user: userId, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: `Marked ${result.modifiedCount} notifications as read`,
      unreadCount: 0,
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
 * Delete a single notification
 * @route DELETE /api/users/notifications/:id
 */
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      user: userId,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    // Get updated unread count
    const unreadCount = await Notification.countDocuments({
      user: userId,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
      unreadCount,
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
 * Clear all notifications (delete all)
 * @route DELETE /api/users/notifications
 */
exports.clearAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await Notification.deleteMany({ user: userId });

    res.status(200).json({
      success: true,
      message: `Cleared ${result.deletedCount} notifications`,
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
 * Get notification stats (unread count, etc.)
 * @route GET /api/users/notifications/stats
 */
exports.getNotificationStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const [totalCount, unreadCount, todayCount, applicationNotifications] =
      await Promise.all([
        Notification.countDocuments({ user: userId }),
        Notification.countDocuments({ user: userId, isRead: false }),
        Notification.countDocuments({
          user: userId,
          createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        }),
        Notification.countDocuments({
          user: userId,
          type: "application_status_change",
        }),
      ]);

    res.status(200).json({
      success: true,
      stats: {
        total: totalCount,
        unread: unreadCount,
        today: todayCount,
        applications: applicationNotifications,
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
