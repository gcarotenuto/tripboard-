import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, type AuthRequest } from "../middleware/auth";

export const dailyRouter = Router();

// GET /daily?date=YYYY-MM-DD
dailyRouter.get("/", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const date = req.query.date as string ?? new Date().toISOString().split("T")[0];

    // Find the active or upcoming trip for this date
    const trip = await prisma.trip.findFirst({
      where: {
        userId: req.userId,
        deletedAt: null,
        status: { in: ["ACTIVE", "UPCOMING"] },
        startsAt: { lte: new Date(`${date}T23:59:59Z`) },
        endsAt: { gte: new Date(`${date}T00:00:00Z`) },
      },
      orderBy: { startsAt: "asc" },
    });

    if (!trip) {
      return res.json({ data: null });
    }

    const board = await prisma.dailyBoard.findUnique({
      where: { tripId_date: { tripId: trip.id, date: new Date(date) } },
    });

    res.json({ data: board });
  } catch (err) {
    next(err);
  }
});

// PATCH /daily/:boardId (update checklist, mark reminders, etc.)
dailyRouter.patch("/:boardId", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const PatchSchema = z.object({
      checklist: z.array(z.object({
        id: z.string(),
        text: z.string(),
        done: z.boolean(),
        order: z.number(),
      })).optional(),
      daySummary: z.string().optional(),
      reminders: z.array(z.object({
        id: z.string(),
        text: z.string(),
        acknowledged: z.boolean(),
      })).optional(),
    });

    const data = PatchSchema.parse(req.body);
    const board = await prisma.dailyBoard.update({
      where: { id: req.params.boardId },
      data,
    });
    res.json({ data: board });
  } catch (err) {
    next(err);
  }
});
