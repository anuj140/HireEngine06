// services/notificationService.js - CORRECTED
const Notification = require("../models/Notification");
const sendEmail = require("../utils/sendEmail");
const Job = require("../models/Job");
const Application = require("../models/Application");
const User = require("../models/User");

// Remove the "class" keyword and use regular functions instead
const NotificationService = {
  /**
   * Create a notification (stores in DB only if important)
   */
  async createNotification(notificationData) {
    try {
      // Don't store low priority notifications in DB
      if (notificationData.priority === "low") {
        // Just send real-time if available, otherwise skip
        return await NotificationService.sendRealTimeNotification(notificationData);
      }

      const notification = new Notification(notificationData);
      await notification.save();

      // Send email for high priority notifications
      if (notification.priority === "high" || notification.priority === "critical") {
        await NotificationService.sendNotificationEmail(notification);
      }

      return notification;
    } catch (error) {
      console.error("Notification creation error:", error);
      // Don't throw - notification failure shouldn't break main flow
      return null;
    }
  },

  /**
   * Send notification email using your template system
   */
  async sendNotificationEmail(notification) {
    try {
      const user = await User.findById(notification.user).select("email name");
      if (!user || !user.email) return;

      // Map notification types to email templates
      const templateMap = {
        JOB_APPLICATION: "job_application_submitted",
        APPLICATION_STATUS: "application_status_update",
        INTERVIEW_SCHEDULED: "interview_scheduled",
        JOB_OFFER: "job_offer_received",
        SYSTEM: "system_notification",
      };

      const templateName = templateMap[notification.type];
      if (!templateName) return;

      // Prepare variables for email template
      const variables = {
        name: user.name,
        notificationTitle: notification.title,
        notificationMessage: notification.message,
        actionUrl: notification.action?.url || "#",
      };

      // Add job-specific variables if applicable
      if (notification.job) {
        const job = await Job.findById(notification.job).select("title companyName");
        if (job) {
          variables.jobTitle = job.title;
          variables.companyName = job.companyName;
        }
      }

      await sendEmail({
        to: user.email,
        template: templateName,
        variables,
      });

      // Update notification email sent status
      notification.emailSent = true;
      await notification.save();

    } catch (error) {
      console.error("Email notification error:", error);
    }
  },

  /**
   * Placeholder for real-time notifications
   */
  async sendRealTimeNotification(notificationData) {
    // Implement WebSocket/Socket.io later
    // For now, this is a placeholder
    return true;
  },

  /**
   * Factory methods for common notifications
   */

  // Job application submitted
  async notifyJobApplication(userId, jobId) {
    try {
      const job = await Job.findById(jobId).select("title companyName");
      if (!job) return;

      return await NotificationService.createNotification({
        user: userId,
        type: "JOB_APPLICATION",
        priority: "normal",
        title: "Application Submitted",
        message: `Your application for "${job.title}" at ${job.companyName} has been submitted successfully.`,
        action: {
          type: "view_job",
          targetId: jobId,
          url: `/jobs/${jobId}`,
        },
        job: jobId,
        important: true,
      });
    } catch (error) {
      console.error("Job application notification error:", error);
    }
  },

  // Application status changed
  async notifyApplicationStatus(applicationId, newStatus) {
    try {
      const application = await Application.findById(applicationId)
        .populate("job", "title")
        .populate("applicant", "email name");

      if (!application || !application.applicant) return;

      const statusMessages = {
        "New": "Your application has been submitted.",
        "Reviewed": "Your application is being reviewed.",
        "Shortlisted": "Congratulations! Your application has been shortlisted!",
        "Interview Scheduled": "An interview has been scheduled for your application.",
        "Hired": "Congratulations! You have been hired!",
        "Rejected": "Your application was not selected for this position.",
      };

      const message = statusMessages[newStatus] || `Your application status has been updated to ${newStatus}.`;
      const priority = newStatus === "Hired" || newStatus === "Shortlisted" ? "high" : "normal";

      return await NotificationService.createNotification({
        user: application.applicant._id,
        type: "APPLICATION_STATUS",
        priority,
        title: "Application Status Update",
        message,
        action: {
          type: "view_application",
          targetId: applicationId,
          url: `/applications/${applicationId}`,
        },
        application: applicationId,
        job: application.job?._id,
        important: priority === "high",
      });
    } catch (error) {
      console.error("Application status notification error:", error);
    }
  },

  // Job match found (low priority - don't store in DB)
  async notifyJobMatch(userId, jobId, matchScore) {
    try {
      const job = await Job.findById(jobId).select("title companyName");
      if (!job) return;

      return await NotificationService.createNotification({
        user: userId,
        type: "JOB_MATCH",
        priority: "low", // Low priority - won't be stored in DB
        title: "New Job Match",
        message: `A new job "${job.title}" at ${job.companyName} matches your profile.`,
        action: {
          type: "view_job",
          targetId: jobId,
          url: `/jobs/${jobId}`,
        },
        job: jobId,
      });
    } catch (error) {
      console.error("Job match notification error:", error);
    }
  },

  // System notification
  async notifySystem(userId, title, message, options = {}) {
    return await NotificationService.createNotification({
      user: userId,
      type: "SYSTEM",
      priority: options.priority || "normal",
      title,
      message,
      action: options.action,
      important: options.important || false,
    });
  },

  // Get user notifications
  async getUserNotifications(userId, options = {}) {
    try {
      return await Notification.getUserNotifications(userId, options);
    } catch (error) {
      console.error("Get notifications error:", error);
      throw error;
    }
  },

  // Get unread count
  async getUnreadCount(userId) {
    try {
      return await Notification.getUnreadCount(userId);
    } catch (error) {
      console.error("Get unread count error:", error);
      return 0;
    }
  },

  // Mark as read
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        _id: notificationId,
        user: userId,
      });

      if (!notification) {
        throw new Error("Notification not found");
      }

      return await notification.markAsRead();
    } catch (error) {
      console.error("Mark as read error:", error);
      throw error;
    }
  },

  // Mark all as read
  async markAllAsRead(userId) {
    try {
      const result = await Notification.updateMany(
        { user: userId, read: false },
        { $set: { read: true } }
      );
      return result;
    } catch (error) {
      console.error("Mark all as read error:", error);
      throw error;
    }
  }
};

module.exports = NotificationService;