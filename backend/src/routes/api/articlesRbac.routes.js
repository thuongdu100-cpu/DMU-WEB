/**
 * REST /api/articles*, /api/rbac/users — JWT + RBAC (compile TS middleware trước khi chạy server).
 */
"use strict";

const path = require("path");
const express = require("express");
const rbacArticleController = require("../../controllers/rbacArticle.controller");

const distAuth = path.join(__dirname, "../../../dist-cjs/middlewares/authMiddleware");

/** @type {{ authenticate: import('express').RequestHandler, authorize: (r: string[]) => import('express').RequestHandler }} */
// eslint-disable-next-line import/no-dynamic-require
const { authenticate, authorize } = require(distAuth);

const router = express.Router();

const POST_ROLES = ["contributor", "editor", "admin"];
const ADMIN_LIST_ROLES = ["contributor", "editor", "admin"];
const MODERATE_ROLES = ["admin", "editor"];

router.get("/articles", rbacArticleController.listPublished);

router.get("/articles/admin", authenticate, authorize(ADMIN_LIST_ROLES), rbacArticleController.listAdmin);

router.post("/articles", authenticate, authorize(POST_ROLES), rbacArticleController.createArticle);

router.patch(
  "/articles/:id/status",
  authenticate,
  authorize(MODERATE_ROLES),
  rbacArticleController.patchStatus
);

router.post("/rbac/users", authenticate, authorize(["admin"]), rbacArticleController.createStaffUser);

module.exports = router;
