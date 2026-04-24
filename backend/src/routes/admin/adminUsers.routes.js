/**
 * CRUD tài khoản — chỉ admin.
 */
"use strict";

const express = require("express");
const { requireAdmin } = require("../../middlewares/requireAdmin");
const { refreshSessionAdminRole } = require("../../middlewares/refreshSessionAdminRole");
const { requireSessionRoles } = require("../../middlewares/requireSessionRoles");
const adminUsersController = require("../../controllers/adminUsers.controller");

const router = express.Router();
router.use(requireAdmin);
router.use(refreshSessionAdminRole);
router.use(requireSessionRoles(["admin"]));

router.get("/users", adminUsersController.list);
router.post("/users", adminUsersController.create);
router.patch("/users/:id", adminUsersController.update);
router.delete("/users/:id", adminUsersController.remove);

module.exports = router;
