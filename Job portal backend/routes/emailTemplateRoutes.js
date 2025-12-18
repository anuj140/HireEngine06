// // routes/emailTemplateRoutes.js
// const express = require("express");
// const router = express.Router();
// const emailTemplateController = require("../controllers/emailTemplateController");

// router.post("/templates", emailTemplateController.upsertTemplate);
// router.get("/templates/:name", emailTemplateController.getTemplate);

// module.exports = router;

const express = require("express");
const router = express.Router();
const { authMiddleware, authorize } = require("../middleware/authentication");
const {
  upsertTemplate,
  getTemplate,
  deleteTemplate,
  listTemplates,
} = require("../controllers/emailTemplateController");

router.use(authMiddleware, authorize("admin"));

router.route("/").post(upsertTemplate).get(listTemplates);
router.route("/:name").get(getTemplate).delete(deleteTemplate);

module.exports = router;
