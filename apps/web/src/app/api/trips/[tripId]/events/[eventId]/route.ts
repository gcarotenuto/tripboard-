import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { tripId: string; eventId: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const trip = await prisma.trip.findFirst({
    where: { id: params.tripId, userId, deletedAt: null },
  });
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const event = await prisma.tripEvent.findFirst({
    where: { id: params.eventId, tripId: params.tripId },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { title, startsAt, endsAt, locationName, details, notes } = body;

  const updated = await prisma.tripEvent.update({
    where: { id: params.eventId },
    data: {
      ...(title !== undefined && { title }),
      ...(startsAt !== undefined && { startsAt: new Date(startsAt) }),
      ...(endsAt !== undefined && { endsAt: new Date(endsAt) }),
      ...(locationName !== undefined && { locationName }),
      ...(details !== undefined && {
        details: typeof details === "object" ? JSON.stringify(details) : details,
      }),
      ...(notes !== undefined && { notes }),
    },
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { tripId: string; eventId: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const trip = await prisma.trip.findFirst({
    where: { id: params.tripId, userId, deletedAt: null },
  });
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const event = await prisma.tripEvent.findFirst({
    where: { id: params.eventId, tripId: params.tripId },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // TripEvent has no deletedAt — hard delete
  await prisma.tripEvent.delete({ where: { id: params.eventId } });

  return NextResponse.json({ data: { deleted: true } });
}
