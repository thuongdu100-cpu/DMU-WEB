/**
 * JWT access token (Bearer) cho lớp bảo mật RBAC.
 */
import jwt from "jsonwebtoken";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const config = require("../../config");

const ISSUER = "dmu-api";

function getSecret(): string {
  const fromEnv = String(process.env.JWT_SECRET || "").trim();
  if (fromEnv.length >= 16) return fromEnv;
  const fallback = String(config.sessionSecret || "dmu-jwt-change-me").trim();
  if (process.env.NODE_ENV === "production" && fallback.length < 16) {
    throw new Error("JWT_SECRET must be set to a strong value in production.");
  }
  return fallback.length >= 16 ? fallback : `${fallback}-pad-to-16chars`;
}

/**
 * Ký JWT gắn với admin id (sub).
 */
export function signAccessToken(adminId: number): string {
  return jwt.sign({ sub: adminId }, getSecret(), {
    expiresIn: "7d",
    issuer: ISSUER
  });
}

/**
 * Xác minh JWT và trả payload sub (admin id).
 */
export function verifyAccessToken(token: string): { sub: number } {
  const decoded = jwt.verify(token, getSecret(), { issuer: ISSUER });
  if (typeof decoded === "string" || decoded == null || typeof decoded !== "object") {
    throw new Error("Invalid token payload");
  }
  const sub = (decoded as jwt.JwtPayload).sub;
  const n = typeof sub === "number" ? sub : Number.parseInt(String(sub), 10);
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error("Invalid subject");
  }
  return { sub: n };
}
