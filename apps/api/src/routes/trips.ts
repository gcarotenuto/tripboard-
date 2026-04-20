import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, type AuthRequest } from "../middleware/auth";
import { createError } from "../middleware/error";

export const tripsRouter = Router();

const CreateTripSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  timezone: z.string().default("UTC"),
  primaryDestination: z.string().optional(),
  destinations: z.array(z.object({
    city: z.string(),
    country: z.string(),
    lat: z.number().optional(),
    lng: z.number().optional(),
  })).default([]),
  tags: z.array(z.string()).default([]),
});

const UpdateTripSchema = CreateTripSchema.partial().extend({
  status: z.enum(["PLANNING", "UPCOMING", "ACTIVE", "COMPLETED", "ARCHIVED"]).optional(),
  coverImageUrl: z.string().url().optional(),
  isArchived: z.boolean().optional(),
});

// GET /trips
tripsRouter.get("/", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { status } = req.query;
    const where: Record<string, unknown> = {
      userId: req.userId,
      deletedAt: null,
    };

    if (status) {
      const statuses = String(status).split(",");
      where.status = { in: statuses };
    }

    const trips = await prisma.trip.findMany({
      where,
      orderBy: [{ startsAt: "asc" }, { createdAt: "desc" }],
      include: {
        _count: { select: { events: true, documents: true, journals: true } },
      },
    });

    res.json({ data: trips });
  } catch (err) {
    next(err);
  }
});

// POST /trips
tripsRouter.post("/", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const data = CreateTripSchema.parse(req.body);
    const trip = await prisma.trip.create({
      data: { ...data, userId: req.userId! },
    });
    res.status(201).json({ data: trip });
  } catch (err) {
    next(err);
  }
});

// GET /trips/:id
tripsRouter.get("/:id", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const trip = await prisma.trip.findFirst({
      where: { id: req.params.id, userId: req.userId, deletedAt: null },
    });
    if (!trip) return next(createError(404, "Trip not found"));
    res.json({ data: trip });
  } catch (err) {
    next(err);
  }
});

// PATCH /trips/:id
tripsRouter.patch("/:id", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const existing = await prisma.trip.findFirst({
      where: { id: req.params.id, userId: req.userId, deletedAt: null },
    });
    if (!existing) return next(createError(404, "Trip not found"));

    const data = UpdateTripSchema.parse(req.body);
    const trip = await prisma.trip.update({
      where: { id: req.params.id },
      data: {
        ...data,
        archivedAt: data.isArchived ? new Date() : undefined,
      },
    });
    res.json({ data: trip });
  } catch (err) {
    next(err);
  }
});

// DELETE /trips/:id  (soft delete)
tripsRouter.delete("/:id", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const existing = await prisma.trip.findFirst({
      where: { id: req.params.id, userId: req.userId, deletedAt: null },
    });
    if (!existing) return next(createError(404, "Trip not found"));

    await prisma.trip.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() },
    });
    res.json({ data: { deleted: true } });
  } catch (err) {
    next(err);
  }
});

// GET /trips/:id/stats
tripsRouter.get("/:id/stats", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const [trip, eventCount, documentCount, journalCount, expenses] = await Promise.all([
      prisma.trip.findFirst({ where: { id: req.params.id, userId: req.userId, deletedAt: null } }),
      prisma.tripEvent.count({ where: { tripId: req.params.id } }),
      prisma.document.count({ where: { tripId: req.params.id, deletedAt: null } }),
      prisma.journalEntry.count({ where: { tripId: req.params.id, deletedAt: null } }),
      prisma.expense.findMany({ where: { tripId: req.params.id }, select: { amount: true, currency: true } }),
    ]);

    if (!trip) return next(createError(404, "Trip not found"));

    const expenseTotal = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    res.json({
      data: {
        eventCount,
        documentCount,
        journalEntryCount: journalCount,
        expenseTotal: Math.round(expenseTotal * 100) / 100,
        expenseCurrency: "EUR",
      },
    });
  } catch (err) {
    next(err);
  }
});
