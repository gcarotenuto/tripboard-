import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { tripId: string; memberId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;

  const trip = await prisma.trip.findFirst({
    where: { id: params.tripId, userId, deletedAt: null },
  });
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (trip.userId !== userId) {
    return NextResponse.json({ error: "Only the trip owner can update roles" }, { status: 403 });
  }

  const body = await req.json();
  const { role } = body;

  if (!role || !["VIEWER", "EDITOR"].includes(role)) {
    return NextResponse.json({ error: "role must be VIEWER or EDITOR" }, { status: 400 });
  }

  const member = await prisma.tripMember.findFirst({
    where: { id: params.memberId, tripId: params.tripId },
  });
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  const updated = await prisma.tripMember.update({
    where: { id: params.memberId },
    data: { role },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { tripId: string; memberId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;

  const trip = await prisma.trip.findFirst({
    where: { id: params.tripId, userId, deletedAt: null },
  });
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (trip.userId !== userId) {
    return NextResponse.json({ error: "Only the trip owner can remove members" }, { status: 403 });
  }

  const member = await prisma.tripMember.findFirst({
    where: { id: params.memberId, tripId: params.tripId },
  });
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  await prisma.tripMember.delete({ where: { id: params.memberId } });

  return NextResponse.json({ data: { deleted: true } });
}
