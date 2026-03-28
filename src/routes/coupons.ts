import { Router } from "express";
import { prisma } from "../prisma";
import { authRequired, AuthRequest } from "../middleware/auth";

const router = Router();

// 쿠폰 발급
router.post("/", authRequired, async (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ ok: false });

  const coupon = await prisma.coupon.create({
    data: {
      // req.user.sub를 String으로 변환
      userId: String(req.user.sub), // coupon 모델에 userId 필드가 추가되었음을 가정
      code: `CP-${Date.now()}`,
      type: "DISCOUNT", // 또는 다른 기본 타입
      value: 100, // 또는 다른 기본 값
    },
  });

  res.json({ ok: true, coupon });
});

export default router;