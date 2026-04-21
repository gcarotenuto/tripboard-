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

  const [eventCount, documentCount, extractedDocumentCount, journalEntryCount, expenseAgg] = await Promise.all([
    prisma.tripEvent.count({ where: { tripId: params.tripId } }),
    prisma.document.count({ where: { tripId: params.tripId, deletedAt: null } }),
    prisma.document.count({ where: { tripId: params.tripId, deletedAt: null, status: { in: ["EXTRACTED", "REVIEWED"] } } }),
    prisma.journalEntry.count({ where: { tripId: params.tripId, deletedAt: null } }),
    prisma.expense.aggregate({ where: { tripId: params.tripId }, _sum: { amount: true }, _max: { currency: true } }),
  ]);

  return NextResponse.json({
    data: {
      eventCount,
      documentCount,
      extractedDocumentCount,
      journalEntryCount,
      expenseTotal: Math.round((expenseAgg._sum.amount ?? 0) * 100) / 100,
      expenseCurrency: expenseAgg._max.currency ?? "EUR",
      startsAt: trip.startsAt,
    },
  });
}
