import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

export async function POST(
  _req: Request,
  { params }: { params: { tripId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;

  const trip = await prisma.trip.findFirst({
    where: { id: params.tripId, userId, deletedAt: null },
  });
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const newTrip = await prisma.trip.create({
    data: {
      userId,
      title: `Copy of ${trip.title}`,
      description: trip.description,
      status: "PLANNING",
      primaryDestination: trip.primaryDestination,
      destinations: trip.destinations,
      tags: trip.tags,
      timezone: trip.timezone,
      // Don't copy dates — user will set new ones
      startsAt: null,
      endsAt: null,
      isPublic: false,
      shareToken: randomUUID(),
    },
    select: { id: true, title: true },
  });

  return NextResponse.json({ data: newTrip }, { status: 201 });
}
