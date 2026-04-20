import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, type AuthRequest } from "../middleware/auth";
import { createError } from "../middleware/error";

export const journalRouter = Router();

const CreateEntrySchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1),
  mood: z.string().optional(),
  weather: z.string().optional(),
  locationName: z.string().optional(),
  locationLat: z.number().optional(),
  locationLng: z.number().optional(),
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// GET /trips/:tripId/journal
journalRouter.get("/:tripId/journal", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const trip = await prisma.trip.findFirst({
      where: { id: req.params.tripId, userId: req.userId, deletedAt: null },
    });
    if (!trip) return next(createError(404, "Trip not found"));

    const entries = await prisma.journalEntry.findMany({
      where: { tripId: req.params.tripId, deletedAt: null },
      orderBy: { entryDate: "desc" },
    });
    res.json({ data: entries });
  } catch (err) {
    next(err);
  }
});

// POST /trips/:tripId/journal
journalRouter.post("/:tripId/journal", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const trip = await prisma.trip.findFirst({
      where: { id: req.params.tripId, userId: req.userId, deletedAt: null },
    });
    if (!trip) return next(createError(404, "Trip not found"));

    const data = CreateEntrySchema.parse(req.body);
    const entry = await prisma.journalEntry.create({
      data: {
        ...data,
        entryDate: new Date(data.entryDate),
        userId: req.userId!,
        tripId: req.params.tripId,
      },
    });
    res.status(201).json({ data: entry });
  } catch (err) {
    next(err);
  }
});

// PATCH /trips/:tripId/journal/:entryId
journalRouter.patch("/:tripId/journal/:entryId", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const entry = await prisma.journalEntry.findFirst({
      where: { id: req.params.entryId, tripId: req.params.tripId, userId: req.userId, deletedAt: null },
    });
    if (!entry) return next(createError(404, "Journal entry not found"));

    const data = CreateEntrySchema.partial().parse(req.body);
    const updated = await prisma.journalEntry.update({
      where: { id: entry.id },
      data: {
        ...data,
        entryDate: data.entryDate ? new Date(data.entryDate) : undefined,
      },
    });
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /trips/:tripId/journal/:entryId
journalRouter.delete("/:tripId/journal/:entryId", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const entry = await prisma.journalEntry.findFirst({
      where: { id: req.params.entryId, tripId: req.params.tripId, userId: req.userId, deletedAt: null },
    });
    if (!entry) return next(createError(404, "Journal entry not found"));

    await prisma.journalEntry.update({
      where: { id: entry.id },
      data: { deletedAt: new Date() },
    });
    res.json({ data: { deleted: true } });
  } catch (err) {
    next(err);
  }
});
