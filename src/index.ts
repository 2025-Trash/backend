import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { prisma } from "./prisma";

// 라우터 import
import authRouter from "./routes/auth";
import pointsRouter from "./routes/points";

const app = express();

const PORT = Number(process.env.PORT || 4000);

// 여러 오리진 허용 (콤마 구분)
const ORIGINS = (process.env.CORS_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((s) => s.trim());

// ===== 미들웨어 =====
app.use(
  cors({
    origin: ORIGINS,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// ===== 헬스체크 =====
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ===== 라우트 등록 =====
app.use("/api/auth", authRouter);
app.use("/api/points", pointsRouter);

// ===== 서버 실행 전 전역 통계 행 보장 =====
async function ensureGlobalStatsRow() {
  try {
    await prisma.globalTreeStats.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1 },
    });
  } catch (e) {
    console.error("Failed to ensure GlobalTreeStats row:", e);
  }
}

// ===== 서버 실행 =====
app.listen(PORT, async () => {
  await ensureGlobalStatsRow();
  console.log(`Backend running at http://localhost:${PORT}`);
});
