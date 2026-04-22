import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { tripId: string; entryId: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const trip = await prisma.trip.findFirst({
    where: { id: params.tripId, userId, deletedAt: null },
  });
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const entry = await prisma.journalEntry.findFirst({
    where: { id: params.entryId, tripId: params.tripId, deletedAt: null },
  });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { title, content, mood, weather, location } = body;

  const updated = await prisma.journalEntry.update({
    where: { id: params.entryId },
    data: {
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(mood !== undefined && { mood }),
      ...(weather !== undefined && { weather }),
      ...(location !== undefined && { location }),
    },
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { tripId: string; entryId: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const trip = await prisma.trip.findFirst({
    where: { id: params.tripId, userId, deletedAt: null },
  });
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const entry = await prisma.journalEntry.findFirst({
    where: { id: params.entryId, tripId: params.tripId, deletedAt: null },
  });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.journalEntry.update({
    where: { id: params.entryId },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ data: { deleted: true } });
}
