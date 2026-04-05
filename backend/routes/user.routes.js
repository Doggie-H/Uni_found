const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { authenticate, requireAdmin } = require("../middleware/auth.middleware");

router.get("/", authenticate, requireAdmin, userController.getUsers);
router.delete("/:id", authenticate, requireAdmin, userController.deleteUser);

module.exports = router;
