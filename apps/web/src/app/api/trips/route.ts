import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeTripStatus } from "@/lib/tripStatus";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");

  const statuses = statusParam ? statusParam.split(",").map((s) => s.trim()) : null;
  const isArchiveQuery = statuses?.some((s) => ["COMPLETED", "ARCHIVED"].includes(s));

  const trips = await prisma.trip.findMany({
    where: {
      userId,
      deletedAt: null,
      ...(isArchiveQuery ? {} : { isArchived: false }),
      ...(statuses ? { status: { in: statuses } } : {}),
    },
    orderBy: { startsAt: "desc" },
    include: {
      _count: {
        select: {
          events: true,
          documents: true,
          journals: true,
          expenses: true,
        },
      },
    },
  });

  // Auto-update statuses that have drifted (fire-and-forget, best effort)
  const updates: Promise<unknown>[] = [];
  for (const trip of trips) {
    const correct = computeTripStatus(trip.status, trip.startsAt, trip.endsAt);
    if (correct !== trip.status) {
      trip.status = correct; // mutate for immediate response correctness
      updates.push(
        prisma.trip.update({ where: { id: trip.id }, data: { status: correct } }).catch(() => {})
      );
    }
  }
  if (updates.length) await Promise.all(updates);

  const parsed = trips.map((t) => {
    const { _count, ...rest } = t;
    return {
      ...rest,
      tags: (() => { try { return JSON.parse(t.tags || "[]"); } catch { return []; } })(),
      destinations: (() => { try { return JSON.parse(t.destinations || "[]"); } catch { return []; } })(),
      memoryCapsule: (() => {
        if (!t.memoryCapsule) return null;
        try { return JSON.parse(t.memoryCapsule as unknown as string); } catch { return null; }
      })(),
      eventCount: _count.events,
      documentCount: _count.documents,
      journalCount: _count.journals,
      expenseCount: _count.expenses,
    };
  });

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
