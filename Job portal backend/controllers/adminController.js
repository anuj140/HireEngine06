
const Recruiter = require("../models/Recruiter");
const User = require("../models/User");

const RecruiterRequest = require("../models/RecruiterRequest");
const BadRequestError = require("../errors/bad-request");
const NotFoundError = require("../errors/not-found");


// Block user/recruiter
exports.blockAccount = async (req, res) => {
  const { id, type } = req.body;
  if (type === "user") await User.findByIdAndUpdate(id, { isActive: false });
  if (type === "recruiter") await Recruiter.findByIdAndUpdate(id, { isActive: false });
  res.status(200).json({ success: true, message: `${type} blocked successfully` });
};

// Admin approves a request
exports.approveRecruiterRequest = async (req, res, next) => {
  try {
    const { requestId } = req.body;

    const request = await RecruiterRequest.findById(requestId);
    if (!request) throw new NotFoundError("Request not found");

    if (!request.emailVerified || !request.phoneVerified) {
      throw new BadRequestError("Recruiter must verify phone & email before approval");
    }

    // 🔑 Use the already-hashed password without rehashing again
    const recruiter = await Recruiter.create({
      name: request.name,
      email: request.email,
      phone: request.phone,
      password: request.password, // <-- keep it
      companyName: request.companyName,
      companyType: request.companyType,
      companyWebsite: request.companyWebsite,
      CIN: request.CIN,
      LLPIN: request.LLPIN,
      GSTIN: request.GSTIN,
      ownerPAN: request.ownerPAN,
      udyamRegNo: request.udyamRegNo,
      documents: request.documents,
      phoneVerified: true,
      emailVerified: true,
      verificationStatus: "verified",
    });

    // mark request as approved
    request.status = "approved";
    await request.save();

    return res.status(200).json({
      success: true,
      message: "Recruiter approved and account created",
      recruiterId: recruiter._id,
    });
  } catch (err) {
    next(err);
  }
};

// Admin rejects a request
exports.rejectRecruiterRequest = async (req, res, next) => {
  try {
    const { requestId, adminNotes } = req.body;

    const request = await RecruiterRequest.findById(requestId);
    if (!request) throw new NotFoundError("Request not found");

    request.status = "rejected";
    request.adminNotes = adminNotes || "Rejected by admin";
    await request.save();

    return res.status(200).json({
      success: true,
      message: "Recruiter request rejected",
    });
  } catch (err) {
    next(err);
  }
};

exports.getAdminProfile = async (req, res) => {
  // Return safe user object derived from auth middleware
  const user = { ...req.user };
  user.id = user._id;
  delete user._id;
  delete user.password;
  res.status(200).json(user);
};

// Get pending recruiter requests
exports.getPendingRecruiterRequests = async (req, res, next) => {
  try {
    const requests = await RecruiterRequest.find({ status: "pending" }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, requests });
  } catch (err) {
    next(err);
  }
};

// Get recruiter request stats
exports.getRecruiterRequestStats = async (req, res, next) => {
  try {
    const total = await RecruiterRequest.countDocuments();
    const pending = await RecruiterRequest.countDocuments({ status: "pending" });
    const approved = await RecruiterRequest.countDocuments({ status: "approved" });
    const rejected = await RecruiterRequest.countDocuments({ status: "rejected" });

    res.status(200).json({
      success: true,
      stats: {
        total,
        pending,
        approved,
        rejected,
      },
    });
  } catch (err) {
    next(err);
  }
};
