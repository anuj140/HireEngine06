const Subscription = require('../models/Subcription');
const SubscriptionPlan = require('../models/SubscriptionPlanSchema');
const { resumePausedJobsOnUpgrade } = require('../utils/subscriptionHelper');
const BadRequestError = require('../errors/bad-request');

exports.upgradePlan = async (req, res, next) => {
  try {
    const recruiterId = req.user.id;
    const { planName } = req.body; // e.g., "pro_2499"

    const newPlan = await SubscriptionPlan.findOne({ name: planName });
    if (!newPlan) throw new BadRequestError('Invalid plan name');

    // Update or create the subscription record
    // We want to keep the history or just update the current one?
    // Usually we mark old one as upgraded/expired and create new one, or update current.
    // The model has 'status'. Let's update the current active one to 'upgraded' (if we had that status) or just update it.
    // For simplicity, we'll update the existing active subscription or create new if none.

    // Find current active subscription
    let sub = await Subscription.findOne({ recruiterId, status: 'active' });

    if (sub) {
      // Update existing
      sub.plan = newPlan._id;
      sub.startDate = new Date();
      sub.endDate = new Date(Date.now() + newPlan.duration * 24 * 60 * 60 * 1000);
      // Reset usage counters for the new plan period?
      // Usually yes.
      sub.usage = {
        jobsPosted: 0,
        activeJobs: sub.usage.activeJobs, // Active jobs remain active
        totalApplications: 0,
        teamMembersAdded: sub.usage.teamMembersAdded, // Team members remain
        managersAdded: sub.usage.managersAdded // Managers remain
      };
      // Update payment info (mock)
      sub.payment = {
        amount: newPlan.price,
        currency: 'INR',
        paymentStatus: 'completed',
        paidAt: new Date()
      };
      await sub.save();
    } else {
      // Create new
      sub = await Subscription.create({
        recruiterId,
        plan: newPlan._id,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + newPlan.duration * 24 * 60 * 60 * 1000),
        payment: {
          amount: newPlan.price,
          currency: 'INR',
          paymentStatus: 'completed',
          paidAt: new Date()
        }
      });
    }

    // Enforce plan limits (resume valid jobs, pause excess/expired jobs/team members)
    const { enforcePlanLimits } = require('../utils/subscriptionHelper');
    await enforcePlanLimits(recruiterId);

    res.json({
      success: true,
      message: `Plan upgraded to ${newPlan.displayName}`,
      subscription: sub,
    });
  } catch (err) {
    next(err);
  }
};

exports.getCurrentSubscription = async (req, res, next) => {
  try {
    const recruiterId = req.user.id;
    const sub = await Subscription.findOne({ recruiterId, status: 'active' }).populate('plan');
    res.status(200).json({ success: true, subscription: sub });
  } catch (err) {
    next(err);
  }
};

exports.getAllPlans = async (req, res, next) => {
  try {
    const plans = await SubscriptionPlan.find({ isActive: true }).sort({ popularityRank: 1 });
    res.status(200).json({ success: true, count: plans.length, plans });
  } catch (err) {
    next(err);
  }
};
