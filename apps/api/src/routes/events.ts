import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, type AuthRequest } from "../middleware/auth";
import { createError } from "../middleware/error";

export const eventsRouter = Router();

const CreateEventSchema = z.object({
  title: z.string().min(1).max(300),
  type: z.enum([
    "FLIGHT", "TRAIN", "BUS", "CAR_RENTAL", "FERRY", "HOTEL",
    "ACCOMMODATION", "RESTAURANT", "ACTIVITY", "TOUR", "TRANSFER",
    "MOMENT", "PHOTO", "NOTE", "VISA", "INSURANCE", "HEALTH", "OTHER",
  ]),
  view: z.enum(["LOGISTICS", "MOMENTS", "BOTH"]).default("LOGISTICS"),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  timezone: z.string().nullable().optional(),
  allDay: z.boolean().default(false),
  locationName: z.string().nullable().optional(),
  locationAddress: z.string().nullable().optional(),
  locationLat: z.number().nullable().optional(),
  locationLng: z.number().nullable().optional(),
  details: z.record(z.unknown()).default({}),
  notes: z.string().nullable().optional(),
  emoji: z.string().nullable().optional(),
});

// GET /trips/:tripId/events
eventsRouter.get("/:tripId/events", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const trip = await prisma.trip.findFirst({
      where: { id: req.params.tripId, userId: req.userId, deletedAt: null },
    });
    if (!trip) return next(createError(404, "Trip not found"));

    const view = req.query.view as string | undefined;
    const where: Record<string, unknown> = { tripId: req.params.tripId, isDuplicate: false };

    if (view && view !== "ALL") {
      where.view = { in: [view, "BOTH"] };
    }

    const events = await prisma.tripEvent.findMany({
      where,
      orderBy: [{ startsAt: "asc" }, { createdAt: "asc" }],
    });

    res.json({ data: events });
  } catch (err) {
    next(err);
  }
});

// POST /trips/:tripId/events
eventsRouter.post("/:tripId/events", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const trip = await prisma.trip.findFirst({
      where: { id: req.params.tripId, userId: req.userId, deletedAt: null },
    });
    if (!trip) return next(createError(404, "Trip not found"));

    const data = CreateEventSchema.parse(req.body);
    const event = await prisma.tripEvent.create({
      data: { ...data, tripId: req.params.tripId },
    });
    res.status(201).json({ data: event });
  } catch (err) {
    next(err);
  }
});

// PATCH /trips/:tripId/events/:eventId
eventsRouter.patch("/:tripId/events/:eventId", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const event = await prisma.tripEvent.findFirst({
      where: { id: req.params.eventId, tripId: req.params.tripId },
      include: { trip: true },
    });

    if (!event || event.trip.userId !== req.userId) {
      return next(createError(404, "Event not found"));
    }

    const data = CreateEventSchema.partial().parse(req.body);
    const updated = await prisma.tripEvent.update({
      where: { id: req.params.eventId },
      data,
    });
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /trips/:tripId/events/:eventId
eventsRouter.delete("/:tripId/events/:eventId", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const event = await prisma.tripEvent.findFirst({
      where: { id: req.params.eventId, tripId: req.params.tripId },
      include: { trip: true },
    });

    if (!event || event.trip.userId !== req.userId) {
      return next(createError(404, "Event not found"));
    }

    await prisma.tripEvent.delete({ where: { id: req.params.eventId } });
    res.json({ data: { deleted: true } });
  } catch (err) {
    next(err);
  }
});
