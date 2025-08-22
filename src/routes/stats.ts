import { Router } from "express";
import { authOptional, AuthedRequest } from "../middleware/auth.js";
import { prisma } from "../utils/prisma.js";

const router = Router();

router.get("/me", authOptional, async (req: AuthedRequest, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const stats = await prisma.userTreeStats.findUnique({ where: { userId: req.user.uid } });
    res.json({ stats: stats ?? { totalUses: 0, totalTrees: 0, totalPoints: 0 } });
  } catch (e) { next(e); }
});

router.get("/global", async (_req, res, next) => {
  try {
    const gs = await prisma.globalTreeStats.findUnique({ where: { id: 1 } });
    res.json({ global: gs ?? { totalUses: 0, totalTrees: 0, totalPointsIssued: 0 } });
  } catch (e) { next(e); }
});

export default router;
