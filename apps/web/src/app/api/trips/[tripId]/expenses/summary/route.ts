import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { tripId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const trip = await prisma.trip.findFirst({ where: { id: params.tripId, userId } });
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const expenses = await prisma.expense.findMany({ where: { tripId: params.tripId } });

  const totalUsd = expenses.reduce((sum, e) => sum + e.amount, 0);
  const byCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {});
  const totalByCurrency = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.currency] = (acc[e.currency] ?? 0) + e.amount;
    return acc;
  }, {});
  const paidCount = expenses.filter((e) => e.isPaid).length;
  const unpaidCount = expenses.length - paidCount;

  return NextResponse.json({ data: { totalUsd, totalByCurrency, byCategory, expenseCount: expenses.length, paidCount, unpaidCount } });
}
