
const express = require("express");
const router = express.Router();
const { getCmsContent, updateCmsContent } = require("../controllers/adminCmsController");
const { authMiddleware, authorize } = require("../middleware/authentication");

router.use(authMiddleware, authorize("admin"));

router.route("/").get(getCmsContent).put(updateCmsContent);

module.exports = router;
