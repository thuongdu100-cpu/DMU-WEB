const express = require("express");
const { verifyAdminCredentials } = require("../../services/adminAuth.service");

const router = express.Router();

router.post("/login", async (req, res, next) => {
  try {
    const usernameRaw = (req.body && req.body.username) || "";
    const password = (req.body && req.body.password) || "";

    const result = await verifyAdminCredentials(usernameRaw, password);
    if (!result.ok) {
      return res.status(401).json({
        ok: false,
        message: "Tên đăng nhập hoặc mật khẩu không đúng."
      });
    }

    req.session.admin = true;
    req.session.adminUsername = result.displayUsername || String(usernameRaw).trim();
    if (result.adminId != null) {
      req.session.adminId = result.adminId;
    } else {
      delete req.session.adminId;
    }

    // Đảm bảo session được lưu vào store TRƯỚC khi trả response
    // Tránh race condition khiến request tiếp theo bị 401
    req.session.save((err) => {
      if (err) return next(err);
      return res.json({
        ok: true,
        message: "Đăng nhập thành công.",
        admin: {
          username: req.session.adminUsername || String(usernameRaw).trim() || null
        }
      });
    });
  } catch (e) {
    next(e);
  }
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
    username: admin && req.session.adminUsername ? req.session.adminUsername : null,
    passwordReturned: false
  });
});

module.exports = router;
