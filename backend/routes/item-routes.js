const express = require("express");
const router = express.Router();
const itemController = require("../controllers/item-controller");
const { authenticate, requireAdmin } = require("../middleware/auth-middleware");
const {
  uploadItemImage,
  ITEM_IMAGE_MAX_COUNT,
} = require("../middleware/upload-middleware");

router.get("/", itemController.getItems);
router.post(
  "/",
  authenticate,
  uploadItemImage.fields([
    { name: "images", maxCount: ITEM_IMAGE_MAX_COUNT },
    { name: "image", maxCount: 1 },
  ]),
  itemController.createItem,
);
router.get("/mine", authenticate, itemController.getMyItems);
router.get(
  "/pending",
  authenticate,
  requireAdmin,
  itemController.getPendingItems,
);
router.put("/:id/my-status", authenticate, itemController.updateMyItemStatus);
router.delete("/:id/my", authenticate, itemController.deleteMyItem);
router.get("/:id", itemController.getItemDetail);
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
