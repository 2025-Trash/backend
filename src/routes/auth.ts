// backend/src/routes/auth.ts
import { Router, Request, Response } from "express";
import { signToken } from "../utils/jwt";              // ✅ utils에서는 signToken만
import { verifyToken, AuthRequest } from "../middleware/auth"; // ✅ 미들웨어는 여기서
import { prisma } from "../prisma";
import bcrypt from "bcrypt";

/** 요청 바디 타입 */
interface SignupBody {
  name: string;
  email: string;
  password: string;
}
interface LoginBody {
  email: string;
  password: string;
}

const router = Router();

/** ---------------------------
 *  POST /api/auth/signup
 * --------------------------- */
router.post(
  "/signup",
  async (req: Request<unknown, unknown, Partial<SignupBody>>, res: Response) => {
    try {
      const { name, email, password } = req.body || {};
      if (!name || !email || !password) {
        return res
          .status(400)
          .json({ ok: false, error: { code: "BAD_REQUEST", message: "필수 값 누락" } });
      }

      const exists = await prisma.user.findUnique({ where: { email } });
      if (exists) {
        return res
          .status(409)
          .json({ ok: false, error: { code: "EMAIL_EXISTS", message: "이미 가입된 이메일입니다." } });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const user = await prisma.user.create({
        data: { name, email, passwordHash },
        select: { id: true, name: true, email: true },
      });

      // (선택) 사용자 통계 초기화
      // await prisma.userTreeStats.create({ data: { userId: user.id, totalUses: 0, totalPoints: 0 } });

      return res.json({ ok: true, user });
    } catch (err) {
      console.error("[signup] error:", err);
      return res
        .status(500)
        .json({ ok: false, error: { code: "INTERNAL", message: "서버 오류" } });
    }
  }
);

/** ---------------------------
 *  POST /api/auth/login
 * --------------------------- */
router.post(
  "/login",
  async (req: Request<unknown, unknown, Partial<LoginBody>>, res: Response) => {
    try {
      const { email, password } = req.body || {};
      if (!email || !password) {
        return res
          .status(400)
          .json({ ok: false, error: { code: "BAD_REQUEST", message: "필수 값 누락" } });
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res
          .status(401)
          .json({
            ok: false,
            error: { code: "INVALID_CREDENTIALS", message: "이메일/비밀번호 확인" },
          });
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return res
          .status(401)
          .json({
            ok: false,
            error: { code: "INVALID_CREDENTIALS", message: "이메일/비밀번호 확인" },
          });
      }

      const token = signToken({ sub: user.id, email: user.email });
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      return res.json({
        ok: true,
        user: { id: user.id, name: user.name, email: user.email },
      });
    } catch (err) {
      console.error("[login] error:", err);
      return res
        .status(500)
        .json({ ok: false, error: { code: "INTERNAL", message: "서버 오류" } });
    }
  }
);

/** ---------------------------
 *  GET /api/auth/me  (토큰 필요)
 * --------------------------- */
router.get(
  "/me",
  verifyToken, // ✅ 미들웨어 적용
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.sub) {
        return res
          .status(401)
          .json({ ok: false, error: { code: "NO_AUTH", message: "인증 필요" } });
      }

      const userId = String(req.user.sub);

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true },
      });

      const stats = await prisma.userTreeStats.findUnique({
        where: { userId },
      });

      return res.json({ ok: true, user, stats });
    } catch (err) {
      console.error("[me] error:", err);
      return res
        .status(500)
        .json({ ok: false, error: { code: "INTERNAL", message: "서버 오류" } });
    }
  }
);

export default router;
