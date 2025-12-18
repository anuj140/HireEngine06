const Subscription = require("../models/Subcription");
const Job = require("../models/Job");
const cron = require("node-cron");

// Check and expire old subscriptions
async function expireSubscriptions() {
  try {
    const now = new Date();
    await Subscription.updateMany(
      { status: "active", endDate: { $lt: now } },
      { status: "expired" }
    );
    console.log("✅ Checked for expired subscriptions");
  } catch (error) {
    console.error("❌ Error expiring subscriptions:", error);
  }
}

// Initialize cron jobs
function initializeSubscriptionCronJobs() {
  // Run every day at midnight
  cron.schedule("0 0 * * *", async () => {
    console.log("🔄 Running daily subscription maintenance...");
    await expireSubscriptions();
  });
}

module.exports = {
  expireSubscriptions,
  initializeSubscriptionCronJobs,
};