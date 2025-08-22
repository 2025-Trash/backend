import jwt, { Secret, SignOptions } from "jsonwebtoken";

const JWT_SECRET: Secret = process.env.JWT_SECRET || "dev-secret";

export type JwtPayload = { uid: string; email: string; name: string };

/**
 * jsonwebtoken의 타입 정의와 깔끔하게 맞추려면
 * `expiresIn` 파라미터를 SignOptions['expiresIn']로 선언합니다.
 */
export function signToken(
  p: JwtPayload,
  expiresIn: SignOptions["expiresIn"] = "7d" // 기본값
) {
  const options: SignOptions = {};
  if (expiresIn !== undefined) options.expiresIn = expiresIn;
  return jwt.sign(p, JWT_SECRET, options);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
