
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// File size limits (bytes)
const PROFILE_PHOTO_LIMIT = 2 * 1024 * 1024; // 2MB
const RESUME_LIMIT = 5 * 1024 * 1024; // 5MB

// Storage for profile photo
const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "jobportal/users/profile_photos",
    allowed_formats: ["jpg", "jpeg", "png"],
    public_id: (req, file) => `${req.user.id}_profile_${Date.now()}`,
  },
});
const uploadProfile = multer({
  storage: profileStorage,
  limits: { fileSize: PROFILE_PHOTO_LIMIT },
});

// Storage for resume
const resumeStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return {
      folder: "jobportal/users/resumes",
      allowed_formats: ["pdf", "doc", "docx"], // Allow Office formats
      resource_type: "auto", // Let Cloudinary determine if it's image/pdf or raw file
      public_id: `${req.user.id}_resume_${Date.now()}`,
    };
  },
});
const uploadResume = multer({
  storage: resumeStorage,
  limits: { fileSize: RESUME_LIMIT },
});

// Recruiter documents
const recruiterDocStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "jobportal/recruiter_requests/documents",
    allowed_formats: ["jpg", "jpeg", "png", "pdf"],
    public_id: (req, file) => `recruiterreq_${req.body.requestId}_${Date.now()}`,
  },
});
const uploadRecruiterDocs = multer({
  storage: recruiterDocStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const recruiterMediaStorage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    let folder = "jobportal/recruiters";
    if (file.fieldname === "bannerImage") folder += "/banner";
    else if (file.fieldname === "logo") folder += "/logo";
    else if (file.fieldname === "leaders") folder += "/leaders";
    else if (file.fieldname === "sections") folder += "/sections";
    else if (file.fieldname === "gallerySections") folder += "/gallery";
    else folder += "/misc";

    return {
      folder,
      allowed_formats: ["jpg", "jpeg", "png"],
      public_id: `${req.user.id}_${file.fieldname}_${Date.now()}`,
    };
  },
});

const uploadRecruiterMedia = multer({
  storage: recruiterMediaStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
});

module.exports = {
  uploadProfile,
  uploadResume,
  uploadRecruiterDocs,
  uploadRecruiterMedia,
};
