import { Router } from "express";
import { AuthedRequest, authRequired } from "../middleware/auth.js";
import { withTx } from "../utils/prisma.js";
import type { PrismaClient } from "@prisma/client";

const router = Router();

router.post("/redeem", authRequired, async (req: AuthedRequest, res, next) => {
  try {
    const { code } = req.body as { code: string };
    const uid = req.user!.uid;

    const redemption = await withTx(async (tx: PrismaClient) => {
      const coupon = await tx.coupon.findUnique({ where: { code } });
      if (!coupon || !coupon.isActive) throw Object.assign(new Error("Invalid coupon"), { status: 400 });
      if (coupon.expiresAt && coupon.expiresAt < new Date()) {
        throw Object.assign(new Error("Coupon expired"), { status: 400 });
      }

      const stats = await tx.userTreeStats.findUnique({ where: { userId: uid } });
      const current = stats?.totalPoints ?? 0;
      if (current < coupon.value) throw Object.assign(new Error("Not enough points"), { status: 400 });

      const used = await tx.pointsLedger.create({
        data: { userId: uid, delta: -coupon.value, reason: "coupon_redeem", refType: "COUPON", refId: coupon.id }
      });

      await tx.userTreeStats.update({
        where: { userId: uid },
        data: { totalPoints: current - coupon.value }
      });

      await tx.couponRedemption.create({
        data: { userId: uid, couponId: coupon.id, usedPoints: coupon.value }
      });

      return used;
    });

    res.status(201).json({ ok: true, ledgerId: redemption.id });
  } catch (e) { next(e); }
});

export default router;
