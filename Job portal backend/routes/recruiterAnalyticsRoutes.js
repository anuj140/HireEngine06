
const express = require("express");
const router = express.Router();
const { getAnalytics } = require("../controllers/recruiterAnalyticsController");

router.get("/", getAnalytics);

module.exports = router;
