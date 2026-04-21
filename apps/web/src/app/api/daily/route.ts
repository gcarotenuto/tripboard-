import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date") ?? new Date().toISOString().split("T")[0];

  const date = new Date(dateParam);
  const dayStart = new Date(date);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setUTCHours(23, 59, 59, 999);

  const activeTrip = await prisma.trip.findFirst({
    where: {
      userId,
      isArchived: false,
      deletedAt: null,
      startsAt: { lte: dayEnd },
      endsAt: { gte: dayStart },
    },
    orderBy: { startsAt: "asc" },
  });

  if (!activeTrip) {
    return NextResponse.json({ data: null });
  }

  const board = await prisma.dailyBoard.findFirst({
    where: { tripId: activeTrip.id, date: { gte: dayStart, lte: dayEnd } },
  });

  const [events, allDocs] = await Promise.all([
    prisma.tripEvent.findMany({
      where: {
        tripId: activeTrip.id,
        startsAt: { gte: dayStart, lte: dayEnd },
      },
      orderBy: { startsAt: "asc" },
    }),
    prisma.document.findMany({
      where: {
        tripId: activeTrip.id,
        deletedAt: null,
        status: { in: ["EXTRACTED", "REVIEWED"] },
      },
      select: { id: true, filename: true, type: true, status: true, extractedData: true },
    }),
  ]);

  // Filter documents that are "ready today" — extractedData has a date field matching today
  const DATE_FIELDS = ["checkIn", "departureDate", "date", "startsAt", "eventDate"];
  const readyDocuments = allDocs
    .filter((doc) => {
      try {
        const data = JSON.parse((doc.extractedData as unknown as string) || "{}");
        return DATE_FIELDS.some((f) => data[f] && String(data[f]).startsWith(dateParam));
      } catch {
        return false;
      }
    })
    .map(({ id, filename, type, status }) => ({ id, filename, type, status }));

  const parsedBoard = board
    ? {
        ...board,
        checklist: JSON.parse((board.checklist as unknown as string) || "[]"),
        reminders: JSON.parse((board.reminders as unknown as string) || "[]"),
      }
    : { id: null, date: dateParam, morningBriefing: null, checklist: [], reminders: [], daySummary: null };

  return NextResponse.json({
    data: {
      tripId: activeTrip.id,
      tripTitle: activeTrip.title,
      events,
      readyDocuments,
      ...parsedBoard,
    },
  });
}
