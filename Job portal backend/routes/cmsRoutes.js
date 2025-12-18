const express = require("express");
const router = express.Router();
const { getPublicCmsContent } = require("../controllers/cmsController");

// This route is public and does not require any auth middleware
router.get("/", getPublicCmsContent);

module.exports = router;
