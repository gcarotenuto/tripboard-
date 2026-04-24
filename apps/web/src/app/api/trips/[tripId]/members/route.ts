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

  const members = await prisma.tripMember.findMany({
    where: { tripId: params.tripId },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ data: members });
}

export async function POST(req: Request, { params }: { params: { tripId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;

  const trip = await prisma.trip.findFirst({
    where: { id: params.tripId, userId, deletedAt: null },
  });
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (trip.userId !== userId) {
    return NextResponse.json({ error: "Only the trip owner can invite members" }, { status: 403 });
  }

  const body = await req.json();
  const { email, role } = body;

  if (!email || !role) {
    return NextResponse.json({ error: "email and role are required" }, { status: 400 });
  }

  if (!["VIEWER", "EDITOR"].includes(role)) {
    return NextResponse.json({ error: "role must be VIEWER or EDITOR" }, { status: 400 });
  }

  const invitedUser = await prisma.user.findFirst({ where: { email } });
  if (!invitedUser) {
    return NextResponse.json({ error: "No account found with that email" }, { status: 404 });
  }

  if (invitedUser.id === userId) {
    return NextResponse.json({ error: "You cannot invite yourself" }, { status: 400 });
  }

  const existing = await prisma.tripMember.findFirst({
    where: { tripId: params.tripId, userId: invitedUser.id },
  });
  if (existing) {
    return NextResponse.json({ error: "Already a member" }, { status: 409 });
  }

  const member = await prisma.tripMember.create({
    data: {
      tripId: params.tripId,
      userId: invitedUser.id,
      role,
      invitedBy: userId,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ data: member }, { status: 201 });
}
