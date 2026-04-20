import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { tripsRouter } from "./routes/trips";
import { eventsRouter } from "./routes/events";
import { documentsRouter } from "./routes/documents";
import { expensesRouter } from "./routes/expenses";
import { journalRouter } from "./routes/journal";
import { ingestRouter } from "./routes/ingest";
import { dailyRouter } from "./routes/daily";
import { authRouter } from "./routes/auth";
import { errorHandler } from "./middleware/error";
import { logger } from "./lib/logger";

const app = express();
const PORT = parseInt(process.env.PORT ?? "3001");

// ── Security ──────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.APP_URL ?? "http://localhost:3000",
    credentials: true,
  })
);

// ── Rate limiting ─────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "60000"),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? "100"),
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ── Body parsing ──────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Logging ───────────────────────────────────────────────────
app.use(morgan("combined", {
  stream: { write: (msg) => logger.info(msg.trim()) },
}));

// ── Health ────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", version: process.env.npm_package_version ?? "0.1.0" });
});

// ── Routes ────────────────────────────────────────────────────
app.use("/auth", authRouter);
app.use("/trips", tripsRouter);
app.use("/trips", eventsRouter);
app.use("/trips", documentsRouter);
app.use("/trips", expensesRouter);
app.use("/trips", journalRouter);
app.use("/daily", dailyRouter);
app.use("/ingest", ingestRouter);

// ── Error handling ────────────────────────────────────────────
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`TripBoard API running on http://localhost:${PORT}`);
});

export default app;
