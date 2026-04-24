import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

// POST → enable public sharing (generate token if needed)
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

  const token = trip.shareToken ?? randomBytes(16).toString("hex");

  const updated = await prisma.trip.update({
    where: { id: params.tripId },
    data: { isPublic: true, shareToken: token },
    select: { shareToken: true, isPublic: true },
  });

  return NextResponse.json({ data: updated });
}

// DELETE → disable public sharing
export async function DELETE(
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

  await prisma.trip.update({
    where: { id: params.tripId },
    data: { isPublic: false },
  });

  return NextResponse.json({ data: { isPublic: false } });
}
