const express = require("express");
const router = express.Router();
const itemController = require("../controllers/item.controller");
const { authenticate, requireAdmin } = require("../middleware/auth.middleware");
const { uploadItemImage } = require("../middleware/upload.middleware");

router.get("/", itemController.getItems);
router.post(
  "/",
  authenticate,
  uploadItemImage.single("image"),
  itemController.createItem,
);
router.get("/:id", itemController.getItemDetail);
router.get(
  "/pending",
  authenticate,
  requireAdmin,
  itemController.getPendingItems,
);
router.put("/:id", authenticate, requireAdmin, itemController.updateItem);
router.put(
  "/:id/approve",
  authenticate,
  requireAdmin,
  itemController.approveItem,
);
router.put(
  "/:id/reject",
  authenticate,
  requireAdmin,
  itemController.rejectItem,
);
router.delete("/:id", authenticate, requireAdmin, itemController.deleteItem);

module.exports = router;
