import { Router } from "express";
import { z } from "zod";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "../lib/prisma";
import { requireAuth, type AuthRequest } from "../middleware/auth";
import { createError } from "../middleware/error";
import { logger } from "../lib/logger";

export const ingestRouter = Router();

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

// GET /ingest/tokens — list user's ingest tokens
ingestRouter.get("/tokens", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const tokens = await prisma.ingestToken.findMany({
      where: { userId: req.userId, isActive: true },
      select: { id: true, label: true, source: true, tripId: true, lastUsedAt: true, usageCount: true, createdAt: true },
    });
    res.json({ data: tokens });
  } catch (err) {
    next(err);
  }
});

// POST /ingest/tokens — create a new email forward token
ingestRouter.post("/tokens", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const Schema = z.object({
      label: z.string().min(1).max(100),
      tripId: z.string().uuid().optional(),
    });
    const { label, tripId } = Schema.parse(req.body);

    const token = await prisma.ingestToken.create({
      data: {
        userId: req.userId!,
        label,
        source: "email_forward",
        tripId: tripId || null,
      },
      select: { id: true, token: true, label: true, source: true, tripId: true, createdAt: true },
    });

    res.status(201).json({ data: token });
  } catch (err) {
    next(err);
  }
});

// POST /ingest/email — webhook endpoint for inbound email forwarding
// Called by Mailgun / Postmark / Sendgrid inbound routes
ingestRouter.post("/email", async (req, res, next) => {
  try {
    // Verify webhook signature
    const secret = process.env.EMAIL_INGEST_SECRET;
    if (secret) {
      const sig = req.headers["x-tripboard-signature"] as string ?? "";
      const rawBody = JSON.stringify(req.body);
      if (!verifyWebhookSignature(rawBody, sig, secret)) {
        return next(createError(401, "Invalid webhook signature"));
      }
    }

    // Extract token from recipient address: token@inbound.yourdomain.com
    const recipient = (req.body as { to?: string }).to ?? "";
    const tokenMatch = recipient.match(/([a-f0-9-]{36})\@/);
    if (!tokenMatch) {
      return next(createError(400, "Could not extract token from recipient address"));
    }

    const tokenValue = tokenMatch[1];
    const ingestToken = await prisma.ingestToken.findUnique({
      where: { token: tokenValue },
    });

    if (!ingestToken?.isActive) {
      return next(createError(404, "Invalid or inactive ingest token"));
    }

    // Update token usage stats
    await prisma.ingestToken.update({
      where: { id: ingestToken.id },
      data: { lastUsedAt: new Date(), usageCount: { increment: 1 } },
    });

    // Create ingest job
    const job = await prisma.ingestJob.create({
      data: {
        userId: ingestToken.userId,
        tripId: ingestToken.tripId,
        status: "QUEUED",
        source: "EMAIL_FORWARD",
        rawPayload: req.body as object,
      },
    });

    logger.info(`Email ingest job created: ${job.id} for user ${ingestToken.userId}`);

    // TODO: enqueue to Bull queue for background processing

    res.json({ data: { jobId: job.id, status: "queued" } });
  } catch (err) {
    next(err);
  }
});

// GET /ingest/jobs — list recent ingest jobs
ingestRouter.get("/jobs", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const jobs = await prisma.ingestJob.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { documents: { select: { id: true, filename: true, type: true, status: true } } },
    });
    res.json({ data: jobs });
  } catch (err) {
    next(err);
  }
});
