/**
 * Bổ sung adminRole cho phiên cũ (trước khi có trường role trong session).
 */
"use strict";

const { prisma } = require("../../db/prisma");
const { normalizeAdminRole } = require("../utils/adminRoles");

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function refreshSessionAdminRole(req, res, next) {
  if (!req.session?.admin || !req.session.adminId || req.session.adminRole) {
    return next();
  }
  try {
    const u = await prisma.admins.findUnique({ where: { id: Number(req.session.adminId) } });
    if (u) {
      req.session.adminRole = normalizeAdminRole(u.role);
    }
  } catch (e) {
    return next(e);
  }
  return next();
}

module.exports = { refreshSessionAdminRole };
