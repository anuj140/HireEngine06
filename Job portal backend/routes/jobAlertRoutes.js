
const express = require("express");
const router = express.Router();
const {
  getAlerts,
  createAlert,
  updateAlert,
  deleteAlert,
} = require("../controllers/jobAlertController");

router.route("/").get(getAlerts).post(createAlert);
router.route("/:id").put(updateAlert).delete(deleteAlert);

module.exports = router;
