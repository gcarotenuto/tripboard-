import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — return current budget
export async function GET(
  _req: Request,
  { params }: { params: { tripId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const trip = await prisma.trip.findFirst({
    where: { id: params.tripId, userId, deletedAt: null },
    select: { budget: true, budgetCurrency: true },
  });
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ data: trip });
}

// PATCH — set/update budget
export async function PATCH(
  req: Request,
  { params }: { params: { tripId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const trip = await prisma.trip.findFirst({
    where: { id: params.tripId, userId, deletedAt: null },
  });
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const budget = body.budget != null ? Number(body.budget) : null;
  const budgetCurrency = body.budgetCurrency ?? "USD";

  const updated = await prisma.trip.update({
    where: { id: params.tripId },
    data: { budget, budgetCurrency },
    select: { budget: true, budgetCurrency: true },
  });

  return NextResponse.json({ data: updated });
}
