// src/middleware/auth.ts
import type { Request, Response, NextFunction } from "express";
import { verifyJwt, JwtPayload } from "../utils/jwt";

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

/** Authorization 헤더 또는 쿠키에서 토큰 꺼내기 */
function extractToken(req: Request): string | null {
  // 1) 쿠키 우선
  const cookieToken = (req as any)?.cookies?.token as unknown;
  if (typeof cookieToken === "string" && cookieToken.trim() !== "") {
    return cookieToken;
  }

  // 2) Authorization: Bearer xxx
  const auth = req.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const t = auth.slice(7).trim();
    if (t) return t;
  }

  return null;
}

/** 필수 인증: 없거나 잘못된 토큰이면 401 */
export function verifyToken(req: AuthRequest, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ ok: false, error: { code: "NO_AUTH", message: "인증 토큰 없음" } });
  }
  try {
    req.user = verifyJwt(token); // ✅ 여기서만 verifyJwt 사용
    return next();
  } catch {
    return res.status(401).json({ ok: false, error: { code: "INVALID_TOKEN", message: "토큰 검증 실패" } });
  }
}

/** 선택 인증: 있어도 되고 없어도 됨 */
export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (token) {
    try { req.user = verifyJwt(token); } catch { /* 무시 */ }
  }
  return next();
}
