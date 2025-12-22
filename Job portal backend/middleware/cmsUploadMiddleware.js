const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// File size limits (bytes)
const CMS_IMAGE_LIMIT = 5 * 1024 * 1024; // 5MB
const CMS_LOGO_LIMIT = 2 * 1024 * 1024; // 2MB

// Allowed file types
const allowedImageFormats = ["jpg", "jpeg", "png", "gif", "webp"];
const allowedLogoFormats = ["jpg", "jpeg", "png", "svg"];

// Main CMS storage
const cmsStorage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    let folder = "jobportal/cms";
    
    // Determine folder based on fieldname or type
    if (file.fieldname === "logo" || file.fieldname === "favicon") {
      folder += "/logos";
    } else if (file.fieldname === "bannerImage") {
      folder += "/banners";
    } else if (file.fieldname === "cardImage") {
      folder += "/cards";
    } else {
      folder += "/general";
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.originalname.split('.')[0];
    const safeName = originalName.replace(/[^a-zA-Z0-9]/g, '_');
    
    return {
      folder,
      allowed_formats: file.fieldname === "logo" || file.fieldname === "favicon" 
        ? allowedLogoFormats 
        : allowedImageFormats,
      public_id: `${safeName}_${timestamp}`,
      resource_type: "auto"
    };
  }
});

// Create multer instance
const uploadCMS = multer({
  storage: cmsStorage,
  limits: { fileSize: CMS_IMAGE_LIMIT },
  fileFilter: (req, file, cb) => {
    // Check file type based on fieldname
    let allowedFormats;
    
    if (file.fieldname === "logo" || file.fieldname === "favicon") {
      allowedFormats = allowedLogoFormats;
    } else {
      allowedFormats = allowedImageFormats;
    }
    
    const fileExt = file.originalname.split('.').pop().toLowerCase();
    
    if (allowedFormats.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${allowedFormats.join(', ')}`), false);
    }
  }
});

// Specific upload handlers
const uploadLogo = uploadCMS.single("logo");
const uploadFavicon = uploadCMS.single("favicon");
const uploadBannerImage = uploadCMS.single("bannerImage");
const uploadCardImage = uploadCMS.single("cardImage");
const uploadMultipleImages = uploadCMS.array("images", 10); // Max 10 images

// Error handling middleware
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        msg: "File too large. Maximum size is 5MB for images, 2MB for logos."
      });
    }
    return res.status(400).json({
      success: false,
      msg: `Upload error: ${err.message}`
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      msg: err.message
    });
  }
  next();
};

module.exports = {
  uploadCMS,
  uploadLogo,
  uploadFavicon,
  uploadBannerImage,
  uploadCardImage,
  uploadMultipleImages,
  handleUploadError
};