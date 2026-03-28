// src/server.ts
import express from "express";
import cors from "cors";

const app = express();
app.use(express.json());

// 개발용: 3000에서 오는 요청 허용
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true, // 쿠키/세션을 쓸 거면 true
}));

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.listen(4000, () => console.log("API on http://localhost:4000"));
