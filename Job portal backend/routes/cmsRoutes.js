const express = require("express");
const router = express.Router();
const cmsController = require("../controllers/cmsController");
const { getPublicCmsContent } = require("../controllers/cmsController");
const { authMiddleware, authorize } = require("../middleware/authentication");
const parseFormDataJson = require("../middleware/parseFormData");
const {
  uploadBannerImage,
  uploadCardImage,
  uploadLogo,
  uploadFavicon,
  handleUploadError,
} = require("../middleware/cmsUploadMiddleware");

router.get("/", getPublicCmsContent);

// ===================== PUBLIC ROUTES =====================

// Website Settings - Public
router.get("/website", cmsController.getWebsiteSettings);

// Banners - Public
router.get("/banners", cmsController.getBanners);
router.get("/banners/:id", cmsController.getBannerById);

// Cards - Public
router.get("/cards", cmsController.getCards);
router.get("/cards/:id", cmsController.getCardById);

// ===================== ADMIN ROUTES =====================

// Apply authentication and admin authorization to all admin routes
router.use(authMiddleware);
router.use(authorize("Admin"));

// Website Settings - Admin only
router.put("/website", cmsController.updateWebsiteSettings);
router.patch("/website/:field", cmsController.updateWebsiteSetting);

// Logo & Favicon upload - Admin only
router.post("/website/upload-logo", uploadLogo, handleUploadError, (req, res) => {
  res.status(200).json({
    success: true,
    msg: "Logo uploaded successfully",
    data: { logoUrl: req.file.path },
  });
});

router.post("/website/upload-favicon", uploadFavicon, handleUploadError, (req, res) => {
  res.status(200).json({
    success: true,
    msg: "Favicon uploaded successfully",
    data: { faviconUrl: req.file.path },
  });
});

// Banners - Admin only
router.post(
  "/banners",
  uploadBannerImage,
  parseFormDataJson,
  handleUploadError,
  cmsController.createBanner
);

router.put(
  "/banners/:id",
  uploadBannerImage,
  handleUploadError,
  cmsController.updateBanner
);

router.delete("/banners/:id", cmsController.deleteBanner);
router.patch("/banners/order", cmsController.updateBannerOrder);

// Cards - Admin only
router.post(
  "/cards",
  uploadCardImage,
  parseFormDataJson,
  handleUploadError,
  cmsController.createCard
);

router.put("/cards/:id", uploadCardImage, handleUploadError, cmsController.updateCard);

router.delete("/cards/:id", cmsController.deleteCard);

module.exports = router;
