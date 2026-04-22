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
    where: { id: params.eventId, tripId: params.tripId, deletedAt: null },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { title, startsAt, endsAt, locationName, details, notes, status } = body;

  const updated = await prisma.tripEvent.update({
    where: { id: params.eventId },
    data: {
      ...(title !== undefined && { title }),
      ...(startsAt !== undefined && { startsAt: new Date(startsAt) }),
      ...(endsAt !== undefined && { endsAt: new Date(endsAt) }),
      ...(locationName !== undefined && { locationName }),
      ...(details !== undefined && { details }),
      ...(notes !== undefined && { notes }),
      ...(status !== undefined && { status }),
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
    where: { id: params.eventId, tripId: params.tripId, deletedAt: null },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.tripEvent.update({
    where: { id: params.eventId },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ data: { deleted: true } });
}
