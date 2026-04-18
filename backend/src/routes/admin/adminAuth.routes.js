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
        message: "T\u00EAn \u0111\u0103ng nh\u1EADp ho\u1EB7c m\u1EADt kh\u1EA9u kh\u00F4ng \u0111\u00FAng."
      });
    }

    req.session.admin = true;
    req.session.adminUsername = result.displayUsername || String(usernameRaw).trim();
    if (result.adminId != null) {
      req.session.adminId = result.adminId;
    } else {
      delete req.session.adminId;
    }

    return res.json({
      ok: true,
      message: "\u0110\u0103ng nh\u1EADp th\u00E0nh c\u00F4ng.",
      admin: {
        username: req.session.adminUsername || String(usernameRaw).trim() || null,
        passwordReturned: false,
        passwordMessage:
          "Khong tra mat khau admin qua API vi ly do bao mat. Dung ADMIN_PASSWORD trong file env de quan ly."
      }
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
