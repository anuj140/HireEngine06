
const Job = require("../models/Job");

exports.getAllJobs = async (req, res) => {
  const { page = 1, limit = 10, title } = req.query;
  const query = {};
  if (title) {
    query.title = { $regex: title, $options: "i" };
  }

  const jobs = await Job.find(query)
    .populate("postedBy", "name")
    .populate("company", "companyName logoUrl") // Populate company details
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 })
    .lean();

  const count = await Job.countDocuments(query);

  res.status(200).json({
    success: true,
    jobs,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
  });
};

exports.updateJobStatus = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { status } = req.body;
    const validStatuses = ['active', 'pending', 'paused', 'closed', 'expired', 'rejected'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, msg: "Invalid status provided" });
    }

    const job = await Job.findByIdAndUpdate(jobId, { status }, { new: true });

    if (!job) {
      return res.status(404).json({ success: false, msg: "Job not found" });
    }

    res.status(200).json({ success: true, job });
  } catch (err) {
    next(err);
  }
};
