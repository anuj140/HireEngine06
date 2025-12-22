const express = require("express");
const router = express.Router();
const { authMiddleware, authorize } = require("../middleware/authentication");
const {
  getRecruiterNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  getNotificationStats,
  getNotificationPreferences,
} = require("../controllers/recruiterNotificationController");

// All routes require authentication and recruiter role
router.use(authMiddleware);
router.use(authorize("recruiter", "HR Manager", "team_member"));

// GET /api/recruiter/notifications
router.get("/", getRecruiterNotifications);

// GET /api/recruiter/notifications/stats
router.get("/stats", getNotificationStats);

// GET /api/recruiter/notifications/preferences
router.get("/preferences", getNotificationPreferences);

// PUT /api/recruiter/notifications/:id/read
router.put("/:id/read", markAsRead);

// PUT /api/recruiter/notifications/read-all
router.put("/read-all", markAllAsRead);

// DELETE /api/recruiter/notifications/:id
router.delete("/:id", deleteNotification);

// DELETE /api/recruiter/notifications
router.delete("/", clearAllNotifications);

module.exports = router;