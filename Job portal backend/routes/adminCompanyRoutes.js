
const express = require("express");
const router = express.Router();
const { getAllCompanies, getCompanyDetails, verifyCompany, suspendCompany } = require("../controllers/adminCompanyController");
const { authMiddleware, authorize } = require("../middleware/authentication");

router.get("/", authMiddleware, authorize("admin"), getAllCompanies);
router.get("/:companyId/details", authMiddleware, authorize("admin"), getCompanyDetails);
router.put("/:companyId/verify", authMiddleware, authorize("admin"), verifyCompany);
router.put("/:companyId/suspend", authMiddleware, authorize("admin"), suspendCompany);

module.exports = router;
