import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { token: string } }
) {
  const trip = await prisma.trip.findUnique({
    where: { shareToken: params.token },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      primaryDestination: true,
      destinations: true,
      startsAt: true,
      endsAt: true,
      isPublic: true,
      user: { select: { name: true } },
      events: {
        where: { isDuplicate: false },
        orderBy: { startsAt: "asc" },
        select: {
          id: true, title: true, type: true,
          startsAt: true, endsAt: true, allDay: true,
          locationName: true, locationLat: true, locationLng: true,
          notes: true, emoji: true,
        },
      },
    },
  });

  if (!trip || !trip.isPublic) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: trip });
}
