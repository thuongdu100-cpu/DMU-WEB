/**
 * article.controller.js
 * Thin controller: nhận request, gọi service, trả response.
 */
"use strict";

const articleService = require("../services/article.service");

function sendServiceError(res, err) {
  return res.status(err?.status || 400).json({
    ok: false,
    message: String(err?.message || "Đã xảy ra lỗi."),
    code: String(err?.code || "ARTICLE_ERROR")
  });
}

async function listAdmin(req, res, next) {
  try {
    const data = await articleService.listAdmin(req.query);
    res.json(data);
  } catch (err) {
    if (err?.code) return sendServiceError(res, err);
    return next(err);
  }
}

async function getAdmin(req, res, next) {
  try {
    const data = await articleService.getAdmin(req.params.id);
    res.json(data);
  } catch (err) {
    if (err?.code) return sendServiceError(res, err);
    return next(err);
  }
}

async function createFromMultipart(req, res, next) {
  try {
    const data = await articleService.createFromMultipart(req);
    return res.status(data.status || 201).json({
      ok: true,
      article: data.article,
      post: data.article
    });
  } catch (err) {
    if (err?.code) return sendServiceError(res, err);
    return next(err);
  }
}

async function updateFromMultipart(req, res, next) {
  try {
    const data = await articleService.updateFromMultipart(req);
    return res.json({
      ok: true,
      article: data.article,
      post: data.article
    });
  } catch (err) {
    if (err?.code) return sendServiceError(res, err);
    return next(err);
  }
}

async function remove(req, res, next) {
  try {
    const data = await articleService.remove(req.params.id);
    res.json(data);
  } catch (err) {
    if (err?.code) return sendServiceError(res, err);
    return next(err);
  }
}

async function listPublic(req, res, next) {
  try {
    const data = await articleService.listPublic(req.query);
    res.json(data);
  } catch (err) {
    if (err?.code) return sendServiceError(res, err);
    return next(err);
  }
}

async function getPublic(req, res, next) {
  try {
    const data = await articleService.getPublic(req.params.id);
    res.json(data);
  } catch (err) {
    if (err?.code) return sendServiceError(res, err);
    return next(err);
  }
}

module.exports = {
  // Admin
  listAdmin,
  getAdmin,
  createFromMultipart,
  updateFromMultipart,
  remove,
  // Public
  listPublic,
  getPublic
};
