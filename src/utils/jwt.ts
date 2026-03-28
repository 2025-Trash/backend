// backend/src/utils/jwt.ts
import jwt, { SignOptions, Secret } from "jsonwebtoken";

const SECRET: Secret = process.env.JWT_SECRET || "dev-secret";

export function signToken(
  payload: Record<string, unknown>,
  expiresIn: SignOptions["expiresIn"] = "7d"
) {
  const options: SignOptions = { expiresIn };
  return jwt.sign(payload, SECRET, options);
}

export function verifyToken<T = any>(token: string): T {
  return jwt.verify(token, SECRET) as T;
}
