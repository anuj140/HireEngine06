const express = require("express");
const router = express.Router();
const { authMiddleware, authorize } = require("../middleware/authentication");
const {
  getAllPlans,
  getCurrentSubscription,
  upgradePlan,
} = require("../controllers/subscriptionController");
const { createRazorpayOrder, verifyPayment } = require("../controllers/paymentController");

// Public
router.get("/plans", getAllPlans);

// Protected
router.use(authMiddleware);
router.get("/current", authorize("recruiter", "team_member"), getCurrentSubscription);
router.post("/upgrade", authorize("recruiter", "Admin"), upgradePlan);

// Payment
router.post("/purchase", authorize("recruiter"), createRazorpayOrder);
router.post("/verify-payment", authorize("recruiter"), verifyPayment);

module.exports = router;