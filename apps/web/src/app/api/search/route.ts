import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ data: { trips: [], events: [], expenses: [], journal: [] } });

  const [trips, events, expenses, journal] = await Promise.all([
    prisma.trip.findMany({
      where: { userId, deletedAt: null, OR: [{ title: { contains: q } }, { primaryDestination: { contains: q } }] },
      select: { id: true, title: true, primaryDestination: true, status: true },
      take: 5,
    }),
    prisma.tripEvent.findMany({
      where: { trip: { userId }, title: { contains: q } },
      select: { id: true, tripId: true, title: true, type: true, startsAt: true },
      take: 5,
    }),
    prisma.expense.findMany({
      where: { userId, title: { contains: q } },
      select: { id: true, tripId: true, title: true, amount: true, currency: true },
      take: 5,
    }),
    prisma.journalEntry.findMany({
      where: { userId, deletedAt: null, OR: [{ title: { contains: q } }, { content: { contains: q } }] },
      select: { id: true, tripId: true, title: true, entryDate: true },
      take: 5,
    }),
  ]);

  return NextResponse.json({ data: { trips, events, expenses, journal } });
}
