const mongoose = require("mongoose");

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      enum: ["free", "standard_999", "pro_2499", "standard_4999"],
      unique: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    duration: {
      type: Number, // in days
      required: true,
    },
    features: {
      maxDescriptionLength: {
        type: Number,
        default: null, // null means unlimited
      },
      maxJobLocations: {
        type: Number,
        default: 1,
      },
      maxApplicationsPerJob: {
        type: Number,
        default: null, // null means unlimited
      },
      jobValidityDays: {
        type: Number,
        required: true,
      },
      maxActiveJobs: {
        type: Number,
        default: null,
      },
      prioritySupport: {
        type: Boolean,
        default: false,
      },
      featuredJobs: {
        type: Boolean,
        default: false,
      },
      analyticsAccess: {
        type: Boolean,
        default: false,
      },
      canAddTeamMembers: {
        type: Boolean,
        default: false,
      },
      maxTeamMembers: {
        type: Number,
        default: 0,
      },
      maxManagers: {
        type: Number,
        default: 0,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
    },
    popularityRank: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Static method to seed default plans
subscriptionPlanSchema.statics.seedDefaultPlans = async function () {
  const plans = [
    {
      name: "free",
      displayName: "Free Plan",
      price: 0,
      duration: 30, // Subscription duration (not job limit)
      features: {
        jobValidityDays: 7,
        maxDescriptionLength: 1000,
        maxApplicationsPerJob: 50,
        maxActiveJobs: 3, // Job Post limit
        maxJobLocations: 1,
        canAddTeamMembers: false,
        maxManagers: 0,
        maxTeamMembers: 0,
        prioritySupport: false,
        featuredJobs: false,
        analyticsAccess: false,
      },
      description: "Perfect for trying out our platform",
      popularityRank: 1,
    },
    {
      name: "standard_999",
      displayName: "Standard Plan",
      price: 999,
      duration: 30,
      features: {
        jobValidityDays: 30,
        maxDescriptionLength: 2000,
        maxApplicationsPerJob: 200,
        maxActiveJobs: 10,
        maxJobLocations: 3,
        canAddTeamMembers: true,
        maxManagers: 1, // Updated: "one manager"
        maxTeamMembers: 2, // Updated: "two team members"
        prioritySupport: false,
        featuredJobs: false,
        analyticsAccess: true,
      },
      description: "Great for small businesses",
      popularityRank: 2,
    },
    {
      name: "pro_2499",
      displayName: "Pro Plan",
      price: 2499,
      duration: 30,
      features: {
        jobValidityDays: 90,
        maxDescriptionLength: 5000,
        maxApplicationsPerJob: 1000,
        maxActiveJobs: 25,
        maxJobLocations: 5,
        canAddTeamMembers: true,
        maxManagers: 2, // Updated: "2 manager"
        maxTeamMembers: 3, // Updated: "3 team members"
        prioritySupport: true,
        featuredJobs: true,
        analyticsAccess: true,
      },
      description: "Most popular for growing companies",
      popularityRank: 3,
    },
    {
      name: "standard_4999", // User called it "Standard Plan 4,999" but let's use a unique name
      displayName: "Enterprise Plan",
      price: 4999,
      duration: 30,
      features: {
        jobValidityDays: 90,
        maxDescriptionLength: 5000,
        maxApplicationsPerJob: 5000,
        maxActiveJobs: 100,
        maxJobLocations: 10,
        canAddTeamMembers: true,
        maxManagers: 4,
        maxTeamMembers: 6, // "10 where 4 manager and remining team members" -> 6 team members
        prioritySupport: true,
        featuredJobs: true,
        analyticsAccess: true,
      },
      description: "Enterprise solution with extended limits",
      popularityRank: 4,
    },
  ];

  for (const plan of plans) {
    await this.findOneAndUpdate({ name: plan.name }, plan, {
      upsert: true,
      new: true,
    });
  }

  console.log("✅ Subscription plans seeded successfully");
};

module.exports = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);