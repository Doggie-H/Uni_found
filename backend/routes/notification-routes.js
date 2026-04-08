const express = require("express");
const router = express.Router();

const notificationController = require("../controllers/notification-controller");
const { authenticate } = require("../middleware/auth-middleware");

router.get("/", authenticate, notificationController.getMyNotifications);
router.put(
  "/read-all",
  authenticate,
  notificationController.markAllNotificationsRead,
);
router.put(
  "/:id/read",
  authenticate,
  notificationController.markNotificationRead,
);

module.exports = router;
