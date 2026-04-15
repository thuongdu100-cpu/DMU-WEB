function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  const status = err.status || 500;
  let message = err.message || "Lỗi máy chủ.";
  /** Multer trả "Unexpected field"; repo DMU dùng busboy — nếu còn thấy thường là nhầm server/cổng. */
  if (message === "Unexpected field" || err.code === "LIMIT_UNEXPECTED_FILE") {
    message =
      "Unexpected field: API đang dùng có thể là bản Multer cũ. Repo này dùng busboy — GET /api/health phải có uploadParser=busboy; dev nên chạy API cổng 3001 khớp Vite proxy.";
  }
  res.status(status).json({
    ok: false,
    message
  });
}

module.exports = { errorHandler };
