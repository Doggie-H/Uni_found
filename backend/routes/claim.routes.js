const express = require("express");
const router = express.Router();
const claimController = require("../controllers/claim.controller");
const { authenticate, requireAdmin } = require("../middleware/auth.middleware");

router.get("/", authenticate, requireAdmin, claimController.getClaims);
router.post("/", authenticate, claimController.createClaim);
router.put(
  "/:id",
  authenticate,
  requireAdmin,
  claimController.updateClaimStatus,
);

module.exports = router;
