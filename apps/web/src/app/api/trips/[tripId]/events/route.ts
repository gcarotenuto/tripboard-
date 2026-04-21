import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { tripId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const { searchParams } = new URL(req.url);
  const view = searchParams.get("view");

  const trip = await prisma.trip.findFirst({ where: { id: params.tripId, userId } });
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const viewFilter = view && view !== "ALL" ? { view: { in: [view, "BOTH"] } } : {};

  const events = await prisma.tripEvent.findMany({
    where: { tripId: params.tripId, ...viewFilter },
    orderBy: { startsAt: "asc" },
  });

  return NextResponse.json({ data: events });
}

export async function POST(req: Request, { params }: { params: { tripId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const trip = await prisma.trip.findFirst({ where: { id: params.tripId, userId } });
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();

  // Determine view from type if not specified
  const LOGISTICS_TYPES = ["FLIGHT","TRAIN","BUS","CAR_RENTAL","FERRY","HOTEL","ACCOMMODATION","TRANSFER","VISA","INSURANCE","HEALTH"];
  const view = body.view ?? (LOGISTICS_TYPES.includes(body.type) ? "LOGISTICS" : "MOMENTS");

  const event = await prisma.tripEvent.create({
    data: {
      tripId: params.tripId,
      title: body.title,
      type: body.type ?? "OTHER",
      view,
      startsAt: body.startsAt ? new Date(body.startsAt) : null,
      endsAt: body.endsAt ? new Date(body.endsAt) : null,
      timezone: body.timezone ?? "UTC",
      allDay: body.allDay ?? false,
      locationName: body.locationName ?? null,
      notes: body.notes ?? null,
      emoji: body.emoji ?? null,
      details: body.details ? JSON.stringify(body.details) : "{}",
      sourceType: "MANUAL",
      confidence: 1.0,
    },
  });

  return NextResponse.json({ data: event }, { status: 201 });
}
