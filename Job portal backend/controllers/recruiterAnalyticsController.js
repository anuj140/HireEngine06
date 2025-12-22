const Job = require("../models/Job");
const Application = require("../models/Application");

exports.getAnalytics = async (req, res) => {
  const recruiterId = req.user.role === "recruiter" ? req.user.id : req.user.recruiterId;

  const jobs = await Job.find({ postedBy: recruiterId }).lean();
  const jobIds = jobs.map((j) => j._id);

  const applications = await Application.find({ job: { $in: jobIds } }).lean();

  const totalApplications = applications.length;
  const shortlisted = applications.filter((a) => a.status === "Shortlisted").length;
  const interviews = applications.filter((a) => a.status === "Interview").length;
  const newApplication = applications.filter((a) => a.status === "New").length;

  const popularJobRoles = jobs
    .map((job) => ({
      title: job.title,
      count: applications.filter((a) => a.job.toString() === job._id.toString()).length,
      percentage:
        totalApplications > 0
          ? (applications.filter((a) => a.job.toString() === job._id.toString()).length /
              totalApplications) *
            100
          : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const jobPerformanceData = jobs.map((j) => ({
    name: j.title,
    applications: applications.filter((a) => a.job.toString() === j._id.toString())
      .length,
    // Mock views as it's not tracked
    views: (
      applications.filter((a) => a.job.toString() === j._id.toString()).length *
      (Math.random() * 5 + 2)
    ).toFixed(0),
  }));

  res.status(200).json({
    success: true,
    data: {
      popularJobRoles,
      jobPerformanceData,
    },
  });
};
