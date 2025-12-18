const Razorpay = require("razorpay");
const crypto = require("crypto");
const Subscription = require("../models/Subcription");
const SubscriptionPlan = require("../models/SubscriptionPlanSchema");
const { BadRequestError, NotFoundError } = require("../errors");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder", // Fallback for dev
  key_secret: process.env.RAZORPAY_KEY_SECRET || "secret",
});

exports.createRazorpayOrder = async (req, res, next) => {
  try {
    const { planId } = req.body;
    const recruiterId = req.user.id;

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan || !plan.isActive) {
      throw new NotFoundError("Subscription plan not found");
    }

    if (plan.price === 0) {
      // Handle free plan activation directly
      // Implementation omitted for brevity, focus on paid flow
      throw new BadRequestError("Free plans are assigned automatically, not purchased.");
    }

    const options = {
      amount: plan.price * 100, // Amount in paise
      currency: plan.currency,
      receipt: `receipt_${Date.now()}`,
      notes: {
        planId: plan._id.toString(),
        recruiterId: recruiterId.toString()
      }
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      order,
      plan,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    next(err);
  }
};

exports.verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;
    const recruiterId = req.user.id;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "secret")
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      // Payment success - Create/Update Subscription
      const plan = await SubscriptionPlan.findById(planId);
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + plan.duration);

      // Deactivate old active subscriptions
      await Subscription.updateMany(
        { recruiterId, status: 'active' },
        { status: 'cancelled' }
      );

      const subscription = await Subscription.create({
        recruiterId,
        plan: plan._id,
        status: 'active',
        startDate,
        endDate,
        payment: {
          amount: plan.price,
          currency: plan.currency,
          paymentMethod: 'razorpay',
          transactionId: razorpay_payment_id,
          paymentStatus: 'completed',
          paidAt: new Date()
        },
        usage: {
          jobsPosted: 0,
          activeJobs: 0
        }
      });

      const { enforcePlanLimits } = require('../utils/subscriptionHelper');
      await enforcePlanLimits(recruiterId);

      res.status(200).json({
        success: true,
        message: "Payment verified and subscription activated",
        subscription
      });

    } else {
      throw new BadRequestError("Invalid payment signature");
    }
  } catch (err) {
    next(err);
  }
};
