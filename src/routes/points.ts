import { Router, Response } from "express";
import { prisma } from "../prisma";
import { authRequired, AuthRequest } from "../middleware/auth";

const router = Router();

/**
 * POST /api/points
 * body: { amount?: number, countUse?: boolean }
 * - amount: 포인트 증가량 (기본 1, 0 이상 정수)
 * - countUse: 사용 횟수(totalUses)를 증가할지 여부 (기본 true)
 */
router.post("/", authRequired, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.sub) {
      return res.status(401).json({ ok: false, error: { code: "NO_AUTH" } });
    }

    // 입력값 방어
    const rawAmount = req.body?.amount;
    const amount = Number.isInteger(rawAmount) && rawAmount >= 0 ? rawAmount : 1;

    const countUse = typeof req.body?.countUse === "boolean" ? req.body.countUse : true;

    // upsert + atomic increment
    const updated = await prisma.userTreeStats.upsert({
      where: { userId: String(req.user.sub) }, // userId가 Unique여야 안전
      update: {
        totalPoints: { increment: amount },
        ...(countUse ? { totalUses: { increment: 1 } } : {}),
      },
      create: {
        userId: String(req.user.sub),
        totalPoints: amount,
        totalUses: countUse ? 1 : 0,
      },
    });

    return res.json({ ok: true, stats: updated });
  } catch (err: any) {
    console.error("[points:add] error:", err);
    // Prisma 고유 에러 코드 대응 (필요 시 확장)
    if (err?.code === "P2002") {
      return res.status(409).json({ ok: false, error: { code: "CONFLICT", message: "중복 키" } });
    }
    return res
      .status(500)
      .json({ ok: false, error: { code: "INTERNAL", message: "서버 오류" } });
  }
});

export default router;
