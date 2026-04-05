const express = require("express");
const router = express.Router();
const claimController = require("../controllers/claim.controller");
const { authenticate, requireAdmin } = require("../middleware/auth.middleware");

router.get("/", authenticate, requireAdmin, claimController.getClaims);
router.get(
  "/return-records",
  authenticate,
  requireAdmin,
  claimController.getReturnRecords,
);
router.post("/", authenticate, claimController.createClaim);
router.post("/:id/confirm-return", authenticate, claimController.confirmReturn);

module.exports = router;
