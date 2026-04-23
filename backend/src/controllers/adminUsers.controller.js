"use strict";

const adminUsersService = require("../services/adminUsers.service");

/**
 * @param {import('express').Response} res
 * @param {unknown} err
 */
function sendErr(res, err) {
  return res.status(err?.status || 400).json({
    ok: false,
    message: String(err?.message || "Lỗi."),
    code: String(err?.code || "ADMIN_USERS_ERROR")
  });
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function list(req, res, next) {
  try {
    const actorRole = adminUsersService.normalizeActorRole(req.session?.adminRole);
    const data = await adminUsersService.listUsers(actorRole);
    res.json(data);
  } catch (e) {
    if (e?.code) return sendErr(res, e);
    next(e);
  }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function create(req, res, next) {
  try {
    const actorRole = adminUsersService.normalizeActorRole(req.session?.adminRole);
    const data = await adminUsersService.createUser(actorRole, req.body || {});
    res.status(201).json(data);
  } catch (e) {
    if (e?.code) return sendErr(res, e);
    next(e);
  }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function update(req, res, next) {
  try {
    const actorRole = adminUsersService.normalizeActorRole(req.session?.adminRole);
    const actorId = Number(req.session?.adminId);
    const data = await adminUsersService.updateUser(actorRole, actorId, req.params.id, req.body || {});
    res.json(data);
  } catch (e) {
    if (e?.code) return sendErr(res, e);
    next(e);
  }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function remove(req, res, next) {
  try {
    const actorRole = adminUsersService.normalizeActorRole(req.session?.adminRole);
    const actorId = Number(req.session?.adminId);
    const data = await adminUsersService.deleteUser(actorRole, actorId, req.params.id);
    res.json(data);
  } catch (e) {
    if (e?.code) return sendErr(res, e);
    next(e);
  }
}

module.exports = { list, create, update, remove };
