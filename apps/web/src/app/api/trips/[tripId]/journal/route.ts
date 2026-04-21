import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { tripId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const trip = await prisma.trip.findFirst({ where: { id: params.tripId, userId } });
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const entries = await prisma.journalEntry.findMany({
    where: { tripId: params.tripId, deletedAt: null },
    orderBy: { entryDate: "desc" },
  });

  return NextResponse.json({ data: entries });
}

export async function POST(req: Request, { params }: { params: { tripId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const trip = await prisma.trip.findFirst({ where: { id: params.tripId, userId } });
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const entry = await prisma.journalEntry.create({
    data: {
      userId,
      tripId: params.tripId,
      title: body.title,
      content: body.content,
      mood: body.mood,
      entryDate: body.entryDate ? new Date(body.entryDate) : new Date(),
    },
  });

  return NextResponse.json({ data: entry }, { status: 201 });
}
