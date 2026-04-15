function requireAdmin(req, res, next) {
  if (req.session && req.session.admin === true) return next();
  return res.status(401).json({ ok: false, message: "Cần đăng nhập admin." });
}

module.exports = { requireAdmin };
