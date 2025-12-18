const Subscription = require("../models/Subcription");
const SubscriptionPlan = require("../models/SubscriptionPlanSchema");
const Job = require("../models/Job");
const { BadRequestError } = require("../errors/bad-request");

/**
 * Returns the active subscription document + its plan for a recruiter.
 */
exports.getActiveSubscription = async (recruiterId) => {
  const sub = await Subscription.findOne({
    recruiterId,
    status: "active",
  }).populate("plan");

  if (!sub) {
    // If no active subscription, try to find a free plan and create one (optional, or just throw)
    // For now, we assume every recruiter should have a subscription (even free)
    // If not found, we might need to create a default free subscription
    const freePlan = await SubscriptionPlan.findOne({ name: "free" });
    if (freePlan) {
      // Create a default free subscription
      const newSub = await Subscription.create({
        recruiterId,
        plan: freePlan._id,
        status: "active",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        payment: { amount: 0, paymentStatus: "completed" },
      });
      return await Subscription.findById(newSub._id).populate("plan");
    }
    throw new Error("No active subscription found");
  }

  // Check expiry
  await sub.checkExpiry();
  if (sub.status !== "active") {
    throw new BadRequestError("Subscription expired. Please renew or upgrade.");
  }

  return sub;
};

/**
 * Checks whether a recruiter can create another job.
 * Throws BadRequestError if any rule is violated.
 */
exports.checkJobCreationLimits = async (recruiterId, jobPayload) => {
  const sub = await exports.getActiveSubscription(recruiterId);
  console.log("checkJobCreation: ", sub);
  const plan = sub.plan; // populated plan

  // 1️⃣ Job‑post count limit
  // Check maxActiveJobs (which seems to be the "Job Post limit" in user requirements)
  // User requirement says "Job Post limit: 3 jobs only". This usually means total active jobs or total jobs posted in a period.
  // The schema has `maxActiveJobs`. Let's use that.
  if (
    plan.features.maxActiveJobs !== null &&
    sub.usage.activeJobs >= plan.features.maxActiveJobs
  ) {
    throw new BadRequestError(
      `Job posting limit reached (${plan.features.maxActiveJobs} active jobs). Upgrade your plan.`
    );
  }

  // 2️⃣ Description length
  if (
    jobPayload.description &&
    jobPayload.description.length > plan.features.maxDescriptionLength
  ) {
    throw new BadRequestError(
      `Job description exceeds limit of ${plan.features.maxDescriptionLength} characters.`
    );
  }

  // 3️⃣ Locations count
  const locations = jobPayload.locations || []; // Assuming locations is an array
  // If locations is a string (as in some implementations), we might need to parse it or check differently.
  // Based on user requirement "Locations where job appear : 1 only one job location", it implies multi-location posting.
  // If the frontend sends an array of locations:
  if (Array.isArray(locations) && locations.length > plan.features.maxJobLocations) {
    throw new BadRequestError(
      `Too many locations. Max allowed: ${plan.features.maxJobLocations}.`
    );
  }

  // 4️⃣ Applicant cap – stored on the Job document
  jobPayload.maxApplicants = plan.features.maxApplicationsPerJob;

  // All checks passed – return the subscription (to increment counters later)
  return sub;
};

/**
 * After a job is successfully created, increment the recruiter’s job counter.
 */
exports.incrementJobCounter = async (subscription) => {
  await subscription.updateUsage("job_posted");
};

/**
 * Enforces plan limits on jobs and team members after a plan change (upgrade/downgrade).
 * - Activates the most recent jobs up to the plan's limit.
 * - Pauses any jobs exceeding the limit.
 * - Pauses jobs that are older than the plan's validity days.
 * - (Optional) Could also enforce team member limits if needed, but usually we just block new adds.
 *   If required to disable excess team members:
 *   - Activate most recent managers/members up to limit.
 *   - Deactivate the rest.
 */
exports.enforcePlanLimits = async (recruiterId) => {
  const sub = await exports.getActiveSubscription(recruiterId);
  const plan = sub.plan;
  const TeamMember = require("../models/TeamMember"); // Lazy load to avoid circular dep if any

  // --- 1. Enforce Job Limits ---
  // Fetch all jobs (active or paused) sorted by newest first
  const allJobs = await Job.find({
    postedBy: recruiterId,
    status: { $in: ["active", "paused"] },
  }).sort({ createdAt: -1 });

  const maxJobs = plan.features.maxActiveJobs || Infinity;
  const validityDays = plan.features.jobValidityDays;
  const now = Date.now();

  let activeCount = 0;

  for (const job of allJobs) {
    const ageDays = Math.floor((now - job.createdAt) / (1000 * 60 * 60 * 24));

    // Check validity period
    if (ageDays > validityDays) {
      if (job.status !== "paused") {
        job.status = "paused";
        await job.save();
      }
      continue; // Expired jobs don't count towards active limit usually, or they are just paused.
    }

    // Check active count limit
    if (activeCount < maxJobs) {
      // This job CAN be active
      if (job.status !== "active") {
        job.status = "active";
        await job.save();
      }
      activeCount++;
    } else {
      // Limit reached, pause this job
      if (job.status !== "paused") {
        job.status = "paused";
        await job.save();
      }
    }
  }

  // Update usage stats
  sub.usage.activeJobs = activeCount;
  await sub.save();

  // --- 2. Enforce Team Member Limits ---
  // Fetch managers
  // Note: In teamController, roles are 'recruiter' (HR Manager) and 'team_member'.
  // We need to find the actual TeamMember documents linked to this recruiter.

  // Managers
  const managers = await TeamMember.find({
    recruiterId: recruiterId,
    role: { $in: ["HR Manager", "recruiter"] }, // Adjust based on actual stored role string
  }).sort({ createdAt: -1 });

  const maxManagers = plan.features.maxManagers || 0;
  let activeManagers = 0;

  for (const manager of managers) {
    if (activeManagers < maxManagers) {
      if (manager.status === "paused") {
        // Assuming 'paused' is the inactive state
        manager.status = "active";
        await manager.save();
      }
      activeManagers++;
    } else {
      if (manager.status !== "paused") {
        manager.status = "paused";
        await manager.save();
      }
    }
  }
  sub.usage.managersAdded = activeManagers;

  // Team Members
  const members = await TeamMember.find({
    recruiterId: recruiterId,
    role: "team_member",
  }).sort({ createdAt: -1 });

  const maxMembers = plan.features.maxTeamMembers || 0;
  let activeMembers = 0;

  for (const member of members) {
    if (activeMembers < maxMembers) {
      if (member.status === "paused") {
        member.status = "active";
        await member.save();
      }
      activeMembers++;
    } else {
      if (member.status !== "paused") {
        member.status = "paused";
        await member.save();
      }
    }
  }
  sub.usage.teamMembersAdded = activeMembers;

  await sub.save();
};

/**
 * Validate team‑member add‑on limits.
 * `type` is either 'manager' or 'teamMember'.
 */
exports.checkTeamAddOnLimits = async (recruiterId, role) => {
  const sub = await exports.getActiveSubscription(recruiterId);
  const plan = sub.plan;

  if (!plan.features.canAddTeamMembers) {
    throw new BadRequestError(
      "Team‑member add‑ons are not allowed for your current plan."
    );
  }

  // Map role to type
  // User roles: 'HR Manager' (manager), 'team_member' (teamMember)
  // Note: In teamController, roles are 'recruiter' (which is HR Manager) and 'team_member'.
  // Let's assume 'recruiter' or 'HR Manager' -> manager, 'team_member' -> teamMember

  if (role === "HR Manager" || role === "recruiter") {
    if (plan.features.maxManagers === 0) {
      throw new BadRequestError("Managers are not allowed for your current plan.");
    }
    if (sub.usage.managersAdded >= plan.features.maxManagers) {
      throw new BadRequestError(`Manager limit reached (${plan.features.maxManagers}).`);
    }
    // We don't increment here, we increment after successful addition
    return sub;
  } else if (role === "team_member") {
    if (plan.features.maxTeamMembers === 0) {
      throw new BadRequestError("Team members are not allowed for your current plan.");
    }
    if (sub.usage.teamMembersAdded >= plan.features.maxTeamMembers) {
      throw new BadRequestError(
        `Team‑member limit reached (${plan.features.maxTeamMembers}).`
      );
    }
    return sub;
  }
};

exports.incrementTeamCounter = async (subscription, role) => {
  if (role === "HR Manager" || role === "recruiter") {
    subscription.usage.managersAdded += 1;
  } else if (role === "team_member") {
    subscription.usage.teamMembersAdded += 1;
  }
  await subscription.save();
};

exports.decrementTeamCounter = async (subscription, role) => {
  if (role === "HR Manager" || role === "recruiter") {
    subscription.usage.managersAdded = Math.max(0, subscription.usage.managersAdded - 1);
  } else if (role === "team_member") {
    subscription.usage.teamMembersAdded = Math.max(
      0,
      subscription.usage.teamMembersAdded - 1
    );
  }
  await subscription.save();
};
