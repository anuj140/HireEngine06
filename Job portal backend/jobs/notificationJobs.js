const cron = require("node-cron");
const notificationUtils = require("../utils/notificationUtils");

// Daily at 9 AM - Check subscription expiry
cron.schedule("0 9 * * *", async () => {
  console.log("Running subscription expiry check...");
  await notificationUtils.checkSubscriptionExpiry();
});

// Daily at 8 PM - Send daily digest
cron.schedule("0 20 * * *", async () => {
  console.log("Sending daily digest...");
  await notificationUtils.sendDailyDigest();
});

// Every hour - Send interview reminders
cron.schedule("0 * * * *", async () => {
  console.log("Checking for interview reminders...");
  await notificationUtils.sendInterviewReminders();
});

// Weekly on Sunday at 3 AM - Cleanup old notifications
cron.schedule("0 3 * * 0", async () => {
  console.log("Cleaning up old notifications...");
  await notificationUtils.cleanupOldNotifications();
});

console.log("Notification cron jobs initialized");
