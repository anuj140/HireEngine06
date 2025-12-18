
const express = require("express");
const router = express.Router();
const {
  getConversations,
  sendMessage,
} = require("../controllers/messageController");
const { authMiddleware } = require("../middleware/authentication");

router.use(authMiddleware);

router.route("/").get(getConversations).post(sendMessage);

module.exports = router;
