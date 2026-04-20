import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, type AuthRequest } from "../middleware/auth";
import { createError } from "../middleware/error";

export const expensesRouter = Router();

const CreateExpenseSchema = z.object({
  title: z.string().min(1).max(300),
  amount: z.number().positive(),
  currency: z.string().length(3).toUpperCase(),
  category: z.enum([
    "TRANSPORT", "ACCOMMODATION", "FOOD", "ACTIVITIES", "SHOPPING",
    "HEALTH", "COMMUNICATION", "INSURANCE", "VISA_FEES", "TIPS", "OTHER",
  ]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().optional(),
  isPaid: z.boolean().default(true),
  paidBy: z.string().optional(),
});

// GET /trips/:tripId/expenses
expensesRouter.get("/:tripId/expenses", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const trip = await prisma.trip.findFirst({
      where: { id: req.params.tripId, userId: req.userId, deletedAt: null },
    });
    if (!trip) return next(createError(404, "Trip not found"));

    const expenses = await prisma.expense.findMany({
      where: { tripId: req.params.tripId },
      orderBy: { date: "desc" },
    });
    res.json({ data: expenses });
  } catch (err) {
    next(err);
  }
});

// GET /trips/:tripId/expenses/summary
expensesRouter.get("/:tripId/expenses/summary", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const trip = await prisma.trip.findFirst({
      where: { id: req.params.tripId, userId: req.userId, deletedAt: null },
    });
    if (!trip) return next(createError(404, "Trip not found"));

    const expenses = await prisma.expense.findMany({
      where: { tripId: req.params.tripId },
      select: { amount: true, currency: true, category: true },
    });

    const totalUsd = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const byCategory = expenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + Number(e.amount);
      return acc;
    }, {});
    const totalByCurrency = expenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.currency] = (acc[e.currency] ?? 0) + Number(e.amount);
      return acc;
    }, {});

    res.json({
      data: {
        totalUsd: Math.round(totalUsd * 100) / 100,
        totalByCurrency,
        byCategory,
        expenseCount: expenses.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /trips/:tripId/expenses
expensesRouter.post("/:tripId/expenses", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const trip = await prisma.trip.findFirst({
      where: { id: req.params.tripId, userId: req.userId, deletedAt: null },
    });
    if (!trip) return next(createError(404, "Trip not found"));

    const data = CreateExpenseSchema.parse(req.body);
    const expense = await prisma.expense.create({
      data: {
        ...data,
        amount: data.amount,
        currency: data.currency as Parameters<typeof prisma.expense.create>[0]["data"]["currency"],
        category: data.category as Parameters<typeof prisma.expense.create>[0]["data"]["category"],
        date: new Date(data.date),
        userId: req.userId!,
        tripId: req.params.tripId,
      },
    });
    res.status(201).json({ data: expense });
  } catch (err) {
    next(err);
  }
});

// DELETE /trips/:tripId/expenses/:expenseId
expensesRouter.delete("/:tripId/expenses/:expenseId", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const expense = await prisma.expense.findFirst({
      where: { id: req.params.expenseId, tripId: req.params.tripId, userId: req.userId },
    });
    if (!expense) return next(createError(404, "Expense not found"));

    await prisma.expense.delete({ where: { id: expense.id } });
    res.json({ data: { deleted: true } });
  } catch (err) {
    next(err);
  }
});
