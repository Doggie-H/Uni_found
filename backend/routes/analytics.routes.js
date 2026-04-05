const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analytics.controller");
const { authenticate, requireAdmin } = require("../middleware/auth.middleware");

router.post("/visit", analyticsController.recordVisit);
router.get(
  "/admin",
  authenticate,
  requireAdmin,
  analyticsController.getAdminAnalytics,
);

module.exports = router;
