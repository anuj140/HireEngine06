const {
  clearAllNotifications,
  deleteNotification,
  getNotificationStats,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
} = require("../controllers/notificationController");
const { authMiddleware, authorize } = require("../middleware/authentication");
const express = require("express");
const router = express.Router();

// Add these routes after existing routes
// User Notifications
router.get("/", authMiddleware, authorize("user"), getUserNotifications);
router.get("/stats", authMiddleware, authorize("user"), getNotificationStats);
router.put("/:id/read", authMiddleware, authorize("user"), markAsRead);
router.put("/read-all", authMiddleware, authorize("user"), markAllAsRead);
router.delete("/:id", authMiddleware, authorize("user"), deleteNotification);
router.delete("/", authMiddleware, authorize("user"), clearAllNotifications);

module.exports = router;
