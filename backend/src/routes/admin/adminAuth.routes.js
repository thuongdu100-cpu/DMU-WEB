const express = require("express");
const { verifyAdminCredentials } = require("../../services/adminAuth.service");
const { prisma } = require("../../../db/prisma");

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
    req.session.adminRole = result.role || "editor";

    // Đảm bảo session được lưu vào store TRƯỚC khi trả response
    // Tránh race condition khiến request tiếp theo bị 401
    req.session.save((err) => {
      if (err) return next(err);
      return res.json({
        ok: true,
        message: "Đăng nhập thành công.",
        admin: {
          username: req.session.adminUsername || String(usernameRaw).trim() || null,
          role: req.session.adminRole || null,
          id: req.session.adminId ?? null
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

router.get("/me", async (req, res, next) => {
  try {
    const admin = !!(req.session && req.session.admin);
    let role = admin && req.session.adminRole ? req.session.adminRole : null;
    const id = admin && req.session.adminId ? req.session.adminId : null;
    if (admin && id && !role) {
      const u = await prisma.admins.findUnique({ where: { id: Number(id) } });
      if (u) {
        let r = String(u.role || "").trim().toLowerCase();
        if (r === "admin") r = "owner";
        role = r || "editor";
        req.session.adminRole = role;
      }
    }
    res.json({
      ok: true,
      admin,
      username: admin && req.session.adminUsername ? req.session.adminUsername : null,
      role,
      id,
      passwordReturned: false
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
