import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { tripId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const trip = await prisma.trip.findFirst({
    where: { id: params.tripId, userId, deletedAt: null },
  });

  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    data: {
      ...trip,
      tags: JSON.parse((trip.tags as unknown as string) || "[]"),
      destinations: JSON.parse((trip.destinations as unknown as string) || "[]"),
    },
  });
}

export async function PATCH(req: Request, { params }: { params: { tripId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const trip = await prisma.trip.findFirst({
    where: { id: params.tripId, userId, deletedAt: null },
  });
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const {
    title, description, status, startsAt, endsAt, timezone,
    primaryDestination, destinations, tags, isArchived, memoryCapsule,
  } = body;

  const updated = await prisma.trip.update({
    where: { id: params.tripId },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(status !== undefined && { status }),
      ...(startsAt !== undefined && { startsAt: new Date(startsAt) }),
      ...(endsAt !== undefined && { endsAt: new Date(endsAt) }),
      ...(timezone !== undefined && { timezone }),
      ...(primaryDestination !== undefined && { primaryDestination }),
      ...(destinations !== undefined && { destinations: Array.isArray(destinations) ? JSON.stringify(destinations) : destinations }),
      ...(tags !== undefined && { tags: Array.isArray(tags) ? JSON.stringify(tags) : tags }),
      ...(isArchived !== undefined && { isArchived }),
      ...(memoryCapsule !== undefined && { memoryCapsule }),
    },
  });

  return NextResponse.json({
    data: {
      ...updated,
      tags: JSON.parse((updated.tags as unknown as string) || "[]"),
      destinations: JSON.parse((updated.destinations as unknown as string) || "[]"),
    },
  });
}

export async function DELETE(_req: Request, { params }: { params: { tripId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const trip = await prisma.trip.findFirst({
    where: { id: params.tripId, userId, deletedAt: null },
  });
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.trip.update({
    where: { id: params.tripId },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ data: { deleted: true } });
}
