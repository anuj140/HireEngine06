// seedJobs.js
require("dotenv").config();
const mongoose = require("mongoose");
const Job = require("./models/Job");
const Recruiter = require("./models/Recruiter");

const connectDB = require("./db/connect");
console.log("connectDB :", connectDB);

const jobs = [
  {
    title: "Frontend Developer Intern",
    position: "Intern",
    companyName: "TechWave Pvt Ltd",
    companyDescription: "We are a SaaS startup building HR solutions.",
    jobType: "remote",
    earningPotential: "5000-10000/month",
    experienceLevel: "internship",
    jobHighlights: ["Work from home", "Flexible hours"],
    description: "Assist in building React components and fixing UI bugs.",
    requirements: ["Basic HTML/CSS/JS", "React basics"],
    skills: ["JavaScript", "React", "CSS"],
    experience: "0-1 years",
    education: "Bachelor's in CS (ongoing or completed)",
    gender: "any",
    location: "Remote",
    salary: 8000,
  },
  {
    title: "Backend Engineer",
    position: "Software Engineer",
    companyName: "DataSoft LLP",
    companyDescription: "Enterprise solutions provider.",
    jobType: "in-office",
    earningPotential: "8-12 LPA",
    fixedEarnings: 900000,
    experienceLevel: "mid",
    jobHighlights: ["Health insurance", "5 days working"],
    description: "Develop and maintain REST APIs in Node.js.",
    requirements: ["Strong in Node.js", "MongoDB knowledge"],
    skills: ["Node.js", "MongoDB", "Express"],
    experience: "2-4 years",
    education: "Bachelor's in CS or related field",
    gender: "any",
    location: "Bangalore",
    salary: 900000,
  },
  {
    title: "UI/UX Designer",
    companyName: "Creative Minds Startup",
    companyDescription: "Design-first product company.",
    jobType: "hybrid",
    experienceLevel: "entry",
    jobHighlights: ["Equity options", "Fast-paced growth"],
    description: "Design wireframes, prototypes, and collaborate with developers.",
    requirements: ["Figma", "Wireframing", "Basic HTML"],
    skills: ["UI/UX", "Figma", "Prototyping"],
    experience: "0-2 years",
    education: "Any design-related degree",
    location: "Mumbai",
    salary: 400000,
  },
  {
    title: "Senior DevOps Engineer",
    companyName: "CloudOps Pvt Ltd",
    companyDescription: "Cloud infrastructure specialists.",
    jobType: "in-office",
    experienceLevel: "senior",
    jobHighlights: ["High salary", "Cutting-edge cloud tech"],
    description: "Manage AWS infrastructure, CI/CD pipelines, and security.",
    requirements: ["AWS expertise", "Terraform", "Kubernetes"],
    skills: ["AWS", "Terraform", "Kubernetes", "CI/CD"],
    experience: "5+ years",
    education: "Bachelor's in CS/IT",
    location: "Hyderabad",
    salary: 2000000,
  },
  {
    title: "Digital Marketing Executive",
    companyName: "Growthify Solutions",
    companyDescription: "Performance marketing agency.",
    jobType: "in-office",
    experienceLevel: "entry",
    jobHighlights: ["Incentives", "Team outings"],
    description: "Plan and execute digital campaigns across Google and Meta.",
    requirements: ["Google Ads", "Facebook Ads", "Analytics"],
    skills: ["Google Ads", "SEO", "Facebook Ads"],
    experience: "0-2 years",
    education: "Any graduation",
    location: "Delhi",
    salary: 350000,
  },
];

const seedJobs = async () => {
  try {
    await connectDB(process.env.MONGO_URI);

    // pick one recruiter (already created in DB)
    const recruiter = await Recruiter.findOne({ _id: "68d53c0fa32dadf6adbb6ce4" });
    if (!recruiter) {
      console.log("❌ No recruiter found. Please create/approve a recruiter first.");
      process.exit(1);
    }

    // attach recruiter to jobs
    const jobPayloads = jobs.map((job) => ({
      ...job,
      postedBy: recruiter._id,
    }));

    await Job.deleteMany(); // clear old jobs
    const createdJobs = await Job.insertMany(jobPayloads);
    console.log("createdJobs: ", createdJobs);

    // update recruiter with jobs posted
    await Recruiter.findByIdAndUpdate(recruiter._id, {
      $push: { jobsPosted: { $each: createdJobs.map((j) => j._id) } },
    });

    console.log(`✅ Seeded ${createdJobs.length} jobs successfully.`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding jobs:", err);
    process.exit(1);
  }
};

seedJobs();
