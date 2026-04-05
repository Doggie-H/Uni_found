const express = require("express");
const router = express.Router();
const itemController = require("../controllers/item.controller");
const { authenticate, requireAdmin } = require("../middleware/auth.middleware");

router.get("/", itemController.getItems);
router.post("/", authenticate, itemController.createItem);
router.get("/:id", itemController.getItemDetail);
router.put("/:id", authenticate, requireAdmin, itemController.updateItem);
router.delete("/:id", authenticate, requireAdmin, itemController.deleteItem);

module.exports = router;
