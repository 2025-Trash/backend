import { Router } from "express";
import { authRequired, AuthedRequest } from "../middleware/auth.js";
import { prisma } from "../utils/prisma.js";
import { withTx } from "../utils/prisma.js";
import type { PrismaClient } from "@prisma/client";

const router = Router();

router.post("/", authRequired, async (req: AuthedRequest, res, next) => {
  try {
    const { delta, reason, refType, refId } = req.body as {
      delta: number; reason: string; refType?: string; refId?: string;
    };
    if (typeof delta !== "number" || !reason) {
      return res.status(400).json({ message: "delta(number) and reason are required" });
    }

    const uid = req.user!.uid;

    const result = await withTx(async (tx: PrismaClient) => {
      const user = await tx.user.findUnique({ where: { id: uid }, include: { stats: true } });
      if (!user) throw Object.assign(new Error("User not found"), { status: 404 });

      const ledger = await tx.pointsLedger.create({
        data: { userId: uid, delta, reason, refType, refId },
      });

      const newPoints = (user.stats?.totalPoints ?? 0) + delta;
      let incUses = 0;
      let incTrees = 0;
      if (refType === "BIN_USE") {
        incUses = 1;
        if (delta > 0 && delta % 4 === 0) incTrees = 1;
      }

      await tx.userTreeStats.upsert({
        where: { userId: uid },
        create: { userId: uid, totalPoints: newPoints, totalUses: incUses, totalTrees: incTrees },
        update: {
          totalPoints: newPoints,
          totalUses: { increment: incUses },
          totalTrees: { increment: incTrees },
        }
      });

      await tx.globalTreeStats.update({
        where: { id: 1 },
        data: {
          totalPointsIssued: delta > 0 ? { increment: delta } : undefined,
          totalUses: { increment: incUses },
          totalTrees: incTrees ? { increment: incTrees } : undefined,
        }
      });

      return ledger;
    });

    res.status(201).json({ ok: true, ledgerId: result.id });
  } catch (e) { next(e); }
});

router.get("/ledger", authRequired, async (req: AuthedRequest, res, next) => {
  try {
    const uid = req.user!.uid;
    const rows = await prisma.pointsLedger.findMany({
      where: { userId: uid }, orderBy: { createdAt: "desc" }, take: 100,
    });
    res.json({ items: rows });
  } catch (e) { next(e); }
});

export default router;
