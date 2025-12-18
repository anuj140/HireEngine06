const express = require("express");
const router = express.Router();
const { authMiddleware, authorize } = require("../middleware/authentication");
const {
  getUserManagementStats,
  getAllUsersList,
} = require("../controllers/adminUserController");
const { getUserDetails } = require("../controllers/adminUserController");
const { blockOrUnblockUser } = require("../controllers/adminUserController");
const { deleteUserAccount } = require("../controllers/adminUserController");
const { resetUserPassword } = require("../controllers/adminUserController");
const { sendMessageToUser } = require("../controllers/adminUserController");
const { updateUserDetails } = require("../controllers/adminUserController");

// Stats + charts + summary
router.get("/stats", authMiddleware, authorize("admin"), getUserManagementStats);

// Full user list
router.get("/list", authMiddleware, authorize("admin"), getAllUsersList);


router.get("/:userId/details", authMiddleware, authorize("admin"), getUserDetails);
router.put("/:userId/details", authMiddleware, authorize("admin"), updateUserDetails);
router.patch("/:userId/block", authMiddleware, authorize("admin"), blockOrUnblockUser);
router.delete("/:userId/delete", authMiddleware, authorize("admin"), deleteUserAccount);
router.post("/:userId/reset-password", authMiddleware, authorize("admin"), resetUserPassword);
router.post("/:userId/message", authMiddleware, authorize("admin"), sendMessageToUser);


module.exports = router;
