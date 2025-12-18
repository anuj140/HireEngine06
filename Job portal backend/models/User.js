
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const EducationSchema = new mongoose.Schema({
  educationLevel: String,
  institution: String,
  course: String,
  specialization: String,
  courseType: { type: String, enum: ['Full time', 'Part time', 'Correspondence/Distance learning'] },
  startYear: String,
  endYear: String,
  gradingSystem: String,
  projects: [String],
}, { _id: false });

const OnlineProfileSchema = new mongoose.Schema({
    name: String,
    url: String,
    description: String,
}, { _id: false });

const CertificationSchema = new mongoose.Schema({
    name: String,
    completionId: String,
    url: String,
    fromMonth: String,
    fromYear: String,
    toMonth: String,
    toYear: String,
    doesNotExpire: Boolean,
}, { _id: false });

const AccomplishmentsSchema = new mongoose.Schema({
    onlineProfiles: [OnlineProfileSchema],
    certifications: [CertificationSchema],
}, { _id: false });

const ITSkillSchema = new mongoose.Schema({
    name: String,
    version: String,
    lastUsed: String,
    experienceYears: String,
    experienceMonths: String,
}, { _id: false });

const CareerProfileSchema = new mongoose.Schema({
  currentIndustry: String,
  department: String,
  roleCategory: String,
  jobRole: String,
  desiredJobTypes: [String],
  desiredEmploymentTypes: [String],
  preferredShift: { type: String, enum: ['Day', 'Night', 'Flexible', ''] },
  preferredLocations: [String],
  expectedSalaryCurrency: String,
  expectedSalaryAmount: String,
}, { _id: false });

const EmploymentSchema = new mongoose.Schema({
  isCurrent: Boolean,
  employmentType: { type: String, enum: ['Full-time', 'Contract', 'Internship'] },
  companyName: String,
  jobTitle: String,
  joiningYear: String,
  joiningMonth: String,
  jobProfile: String,
  workedTillYear: String,
  workedTillMonth: String,
}, { _id: false });

const PrivacySettingsSchema = new mongoose.Schema({
    showFullName: Boolean,
    allowResumeDownload: Boolean,
    showContactInfo: Boolean,
}, { _id: false });

const UserProfileSchema = new mongoose.Schema({
    headline: { type: String, default: '' },
    profileSummary: { type: String, default: '' },
    resumeUrl: String,
    skills: { type: [String], default: [] },
    itSkills: { type: [ITSkillSchema], default: [] },
    profileCompletion: { type: Number, default: 0 },
    location: { type: String, default: '' },
    phone: { type: String, default: '' },
    employment: { type: [EmploymentSchema], default: [] },
    education: { type: [EducationSchema], default: [] },
    accomplishments: { type: AccomplishmentsSchema, default: () => ({ onlineProfiles: [], certifications: [] }) },
    careerProfile: { type: CareerProfileSchema, default: {} },
    privacySettings: { type: PrivacySettingsSchema, default: { showFullName: true, allowResumeDownload: true, showContactInfo: false } },
    workStatus: { type: String, enum: ['Fresher', 'Experienced'] },
    totalExperience: { years: String, months: String },
    currentSalary: { currency: String, amount: String, breakdown: String },
    currentLocation: { inIndia: Boolean, city: String, area: String },
    expectedSalary: { currency: String, amount: String },
    dateOfBirth: String,
    gender: { type: String, enum: ['Male', 'Female', 'Other']},
    maritalStatus: { type: String, enum: ['Single', 'Married']},
    address: String,
}, { _id: false });

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    phoneVerified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    role: {
      type: String,
      enum: ['user', 'JobSeeker', 'CompanyAdmin', 'Recruiter', 'HRManager', 'Admin'],
      default: 'JobSeeker',
    },
    isActive: { type: Boolean, default: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Recruiter' },
    profilePhoto: String,
    profile: { type: UserProfileSchema, default: () => ({}) },
    bookmarks: [{
        job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
        savedAt: { type: Date, default: Date.now }
    }],
    appliedJobs: [{ job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' }, status: String }],
    loginHistory: [{ timestamp: Date }],
    adminNotes: [String],
    warnings: [String],
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);
