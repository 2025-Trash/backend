import { Request, Response, NextFunction } from "express";
// 배럴 말고 직접 파일로 임포트 (.js 확장자 필수)
import { verifyToken, JwtPayload } from "../utils/jwt.js";

export type AuthedRequest = Request & { user?: JwtPayload };

export function authOptional(req: AuthedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) return next();
  const token = header.replace(/^Bearer\s+/i, "");
  try { req.user = verifyToken(token); } catch {}
  next();
}

export function authRequired(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "Missing Authorization header" });
  const token = header.replace(/^Bearer\s+/i, "");
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
