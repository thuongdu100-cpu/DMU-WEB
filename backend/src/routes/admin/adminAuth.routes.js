const path = require("path");
const express = require("express");
const { verifyAdminCredentials } = require("../../services/adminAuth.service");
const { prisma } = require("../../../db/prisma");

/** @type {{ signAccessToken: (id: number) => string } | null} */
let jwtAccess = null;
try {
  // eslint-disable-next-line import/no-dynamic-require
  jwtAccess = require(path.join(__dirname, "../../../dist-cjs/auth/jwtAccess"));
} catch {
  jwtAccess = null;
}

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
    req.session.adminRole = result.role || "contributor";

    // Đảm bảo session được lưu vào store TRƯỚC khi trả response
    // Tránh race condition khiến request tiếp theo bị 401
    req.session.save((err) => {
      if (err) return next(err);
      let token = null;
      if (jwtAccess && result.adminId != null) {
        try {
          token = jwtAccess.signAccessToken(result.adminId);
        } catch {
          token = null;
        }
      }
      return res.json({
        ok: true,
        message: "Đăng nhập thành công.",
        admin: {
          username: req.session.adminUsername || String(usernameRaw).trim() || null,
          role: req.session.adminRole || null,
          id: req.session.adminId ?? null
        },
        ...(token ? { token } : {})
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
        const { normalizeAdminRole } = require("../../utils/adminRoles");
        role = normalizeAdminRole(u.role);
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
