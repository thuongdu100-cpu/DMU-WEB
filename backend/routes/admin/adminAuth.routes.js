const express = require("express");
const config = require("../../config");

const router = express.Router();

router.post("/login", (req, res) => {
  const usernameRaw = (req.body && req.body.username) || "";
  const username = String(usernameRaw).trim().toLowerCase();
  const password = (req.body && req.body.password) || "";

  if (username === config.adminUsername && password === config.adminPassword) {
    req.session.admin = true;
    req.session.adminUsername = usernameRaw.trim() || username;
    return res.json({ ok: true, message: "Đăng nhập thành công." });
  }
  return res.status(401).json({ ok: false, message: "Tên đăng nhập hoặc mật khẩu không đúng." });
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

router.get("/me", (req, res) => {
  const admin = !!(req.session && req.session.admin);
  res.json({
    ok: true,
    admin,
    username: admin && req.session.adminUsername ? req.session.adminUsername : null
  });
});

module.exports = router;
