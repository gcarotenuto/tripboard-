import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");

  const statusFilter = statusParam
    ? { status: { in: statusParam.split(",") } }
    : {};

  const trips = await prisma.trip.findMany({
    where: { userId, isArchived: false, deletedAt: null, ...statusFilter },
    orderBy: { startsAt: "asc" },
  });

  const parsed = trips.map((t) => ({
    ...t,
    tags: JSON.parse(t.tags || "[]"),
    destinations: JSON.parse(t.destinations || "[]"),
  }));

  return NextResponse.json({ data: parsed });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const body = await req.json();

  const trip = await prisma.trip.create({
    data: {
      userId,
      title: body.title,
      description: body.description,
      status: body.status ?? "PLANNING",
      startsAt: body.startsAt ? new Date(body.startsAt) : null,
      endsAt: body.endsAt ? new Date(body.endsAt) : null,
      timezone: body.timezone ?? "UTC",
      primaryDestination: body.primaryDestination,
      destinations: JSON.stringify(body.destinations ?? []),
      tags: JSON.stringify(body.tags ?? []),
    },
  });

  return NextResponse.json({ data: trip }, { status: 201 });
}
