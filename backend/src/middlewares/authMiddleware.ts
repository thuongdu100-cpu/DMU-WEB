/**
 * RBAC — xác thực JWT và kiểm tra role từ DB.
 */
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { prisma } = require("../../db/prisma");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { verifyAccessToken } = require("../auth/jwtAccess");

function normalizeDbRole(role: string | null | undefined): string {
  const r = String(role || "").trim().toLowerCase();
  if (r === "admin" || r === "owner") return "admin";
  if (r === "moderator") return "editor";
  if (r === "contributor") return "contributor";
  if (r === "editor") return "editor";
  if (r === "bot") return "contributor";
  return "unknown";
}

/**
 * Đọc Bearer JWT, xác minh và nạp role mới nhất từ bảng `admins`.
 */
export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = String(req.headers.authorization || "");
  if (!header.toLowerCase().startsWith("bearer ")) {
    res.status(401).json({
      ok: false,
      message: "Thiếu hoặc sai định dạng Authorization (Bearer JWT).",
      code: "UNAUTHENTICATED"
    });
    return;
  }
  const token = header.slice(7).trim();
  if (!token) {
    res.status(401).json({ ok: false, message: "Token trống.", code: "UNAUTHENTICATED" });
    return;
  }
  try {
    const { sub } = verifyAccessToken(token);
    const admin = await prisma.admins.findUnique({ where: { id: sub } });
    if (!admin) {
      res.status(401).json({
        ok: false,
        message: "Tài khoản trong token không còn tồn tại.",
        code: "UNAUTHENTICATED"
      });
      return;
    }
    req.authUser = {
      id: admin.id,
      role: normalizeDbRole(admin.role),
      username: admin.username
    };
    next();
  } catch (err: unknown) {
    if (err instanceof jwt.JsonWebTokenError || err instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        ok: false,
        message: "Token không hợp lệ hoặc đã hết hạn.",
        code: "UNAUTHENTICATED"
      });
      return;
    }
    next(err instanceof Error ? err : new Error(String(err)));
  }
}

/**
 * So khớp role đã chuẩn hoá với danh sách được phép (admin | editor | contributor).
 */
export function authorize(allowedRoles: string[]) {
  const allowed = new Set(allowedRoles.map((r) => r.trim().toLowerCase()));
  return (req: Request, res: Response, next: NextFunction): void => {
    const role = req.authUser?.role?.toLowerCase();
    if (!role || !allowed.has(role)) {
      res.status(403).json({
        ok: false,
        message: "Không đủ quyền thực hiện thao tác.",
        code: "FORBIDDEN"
      });
      return;
    }
    next();
  };
}
