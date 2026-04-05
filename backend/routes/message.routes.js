const express = require("express");
const router = express.Router();
const messageController = require("../controllers/message.controller");
const { authenticate } = require("../middleware/auth.middleware");

router.get("/conversations", authenticate, messageController.getConversations);
router.get(
  "/conversations/:conversationId/messages",
  authenticate,
  messageController.getConversationMessages,
);
router.post(
  "/conversations/:conversationId/messages",
  authenticate,
  messageController.sendMessage,
);

module.exports = router;
