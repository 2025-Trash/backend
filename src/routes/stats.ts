import { Router } from "express";
import { prisma } from "../prisma";
import { authOptional, AuthRequest } from "../middleware/auth";

const router = Router();

// 전체 통계 + 내 통계
router.get("/", authOptional, async (req: AuthRequest, res) => {
  // prisma.globalTreeStats로 모델명 수정
  const globalStats = await prisma.globalTreeStats.aggregate({
    _sum: { totalPointsIssued: true, totalUses: true }, // GlobalTreeStats 스키마에 맞게 필드명 수정
  });

  let myStats = null;
  if (req.user) {
    // prisma.userTreeStats로 모델명 수정
    myStats = await prisma.userTreeStats.findUnique({
      // req.user.sub를 String으로 변환
      where: { userId: String(req.user.sub) },
    });
  }

  res.json({
    ok: true,
    global: {
      totalPoints: globalStats._sum.totalPointsIssued ?? 0, // 필드명 수정
      totalUses: globalStats._sum.totalUses ?? 0,
    },
    me: myStats,
  });
});

export default router;