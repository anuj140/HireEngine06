const mongoose = require("mongoose");

const socialSubSchema = new mongoose.Schema(
    {
        website: { type: String },
        linkedin: { type: String },
        twitter: { type: String },
        facebook: { type: String },
        phone: { type: String },
    },
    { _id: false }
);

const jobSchema = new mongoose.Schema(
    {
        // Primary job identity
        title: { type: String, required: [true, "Please provide title"] },
        position: { type: String },

        // Company
        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Recruiter",
            required: true,
        },
        companyName: { type: String },
        companyDescription: { type: String },
        companySocial: { type: socialSubSchema },

        // Job metadata
        jobType: {
            type: String,
            enum: ["Full-time", "Part-time", "Contract", "Internship"],
            required: true,
        },
        workMode: {
            type: String,
            enum: ["On-site", "Hybrid", "Remote"],
            default: "On-site",
        },
        earningPotential: { type: String },
        fixedEarnings: { type: Number },
        //? Does value in enum for experienceLevel correct
        experienceLevel: {
            type: String,
            enum: ["internship", "entry", "mid", "senior", "lead", "manager", "executive"],
        },
        jobHighlights: { type: [String], default: [] },

        // Core content
        description: { type: String, required: [true, "Please provide description"] },
        requirements: { type: [String], default: [] },
        skills: { type: [String], required: [true, "Please provide skills"] },
        experience: { type: String },
        education: { type: String },
        educationalQualification: { type: String },
        gender: { type: String, enum: ["any", "male", "female", "other"], default: "any" },
        location: { type: String },

        // Additional Fields
        industry: { type: String },
        department: { type: String },
        perksAndBenefits: { type: [String], default: [] },
        shiftTimings: {
            type: String,
            enum: ["Day", "Night", "Rotational"],
            default: "Day"
        },
        noticePeriodPreference: { type: String },
        preferredCandidateLocation: { type: String },
        hiringType: {
            type: String,
            enum: ["Direct", "Agency"],
            default: "Direct"
        },
        applicationInstructions: { type: String },
        interviewProcessInfo: { type: String },

        // Financial
        salary: { type: Number },
        fixedEarningsDuplicate: { type: Number },

        // Recruiter info
        postedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Recruiter",
            required: [true, "Each job post must be linked to a recruiter"],
        },

        visibility: { type: Boolean, default: true },
        status: {
            type: String,
            enum: ["active", "paused", "closed", "expired"],
            default: "active",
        },

        questions: [
            {
                question: { type: String, required: true },
                type: { type: String, enum: ["text", "boolean"], default: "text" },
            },
        ],

        // Approval system
        approvalStatus: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Recruiter",
        },
        approvedAt: { type: Date },
        rejectionReason: { type: String },
        postedByUser: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: "postedByModel",
        },
        postedByModel: {
            type: String,
            enum: ["Recruiter", "TeamMember"],
            default: "Recruiter",
        },
        postedByName: { type: String },

        // Applicants
        applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: "Application" }],

        // View tracking
        viewCount: {
            type: Number,
            default: 0,
        },

        // ✅ NEW: Subscription-related fields
        subscriptionPlan: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SubscriptionPlan",
        },

        // Job expiry based on subscription plan
        expiryDate: {
            type: Date,
            required: true,
            index: true,
        },
        applicationDeadline: { type: Date }, // Alias for expiryDate if needed, or separate

        // Maximum applications allowed (from subscription plan)
        maxApplications: {
            type: Number,
            default: null, // null means unlimited
        },

        // Track if job is featured (premium feature)
        isFeatured: {
            type: Boolean,
            default: false,
        },

        // Current application count (for easier queries)
        currentApplicationCount: {
            type: Number,
            default: 0,
        },

        // Flag to mark if job has reached application limit
        applicationLimitReached: {
            type: Boolean,
            default: false,
        },

        // Auto-close when limit reached
        autoClosedAt: {
            type: Date,
        },
    },
    { timestamps: true }
);

// Text index for search
jobSchema.index({
    title: "text",
    position: "text",
    description: "text",
    skills: "text",
    companyName: "text",
    jobHighlights: "text",
});

// Also index commonly filtered fields
jobSchema.index({ location: 1 });
jobSchema.index({ salary: 1 });
jobSchema.index({ postedBy: 1 });
jobSchema.index({ jobType: 1 });
jobSchema.index({ experienceLevel: 1 });
jobSchema.index({ expiryDate: 1, status: 1 });
jobSchema.index({ isFeatured: 1, status: 1 });

// Virtual to check if job is expired
jobSchema.virtual("isExpired").get(function () {
    return this.expiryDate < new Date();
});

// Virtual to check if accepting applications
jobSchema.virtual("isAcceptingApplications").get(function () {
    if (this.status !== "active") return false;
    if (this.expiryDate < new Date()) return false;
    if (this.applicationLimitReached) return false;
    return true;
});

// Pre-save middleware to check expiry
jobSchema.pre("save", function (next) {
    if (this.expiryDate < new Date() && this.status === "active") {
        this.status = "expired";
    }
    next();
});

// Method to increment application count
jobSchema.methods.incrementApplicationCount = async function () {
    this.currentApplicationCount += 1;

    // Check if limit reached
    if (
        this.maxApplications !== null &&
        this.currentApplicationCount >= this.maxApplications
    ) {
        this.applicationLimitReached = true;
        this.status = "closed";
        this.autoClosedAt = new Date();
    }

    await this.save();
};

// Method to check if job can receive more applications
jobSchema.methods.canReceiveApplications = function () {
    if (this.status !== "active") return false;
    if (this.expiryDate < new Date()) return false;
    if (this.applicationLimitReached) return false;
    if (
        this.maxApplications !== null &&
        this.currentApplicationCount >= this.maxApplications
    ) {
        return false;
    }
    return true;
};

// Static method to expire old jobs
jobSchema.statics.expireOldJobs = async function () {
    const result = await this.updateMany(
        {
            expiryDate: { $lt: new Date() },
            status: "active",
        },
        {
            $set: { status: "expired" },
        }
    );
    return result;
};

module.exports = mongoose.model("Job", jobSchema);