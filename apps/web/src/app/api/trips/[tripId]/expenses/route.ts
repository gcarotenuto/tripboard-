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

  const expenses = await prisma.expense.findMany({
    where: { tripId: params.tripId },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ data: expenses });
}

export async function POST(req: Request, { params }: { params: { tripId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const trip = await prisma.trip.findFirst({ where: { id: params.tripId, userId } });
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();

  const expense = await prisma.expense.create({
    data: {
      userId,
      tripId: params.tripId,
      title: body.title,
      amount: body.amount,
      currency: body.currency ?? "USD",
      amountUsd: body.amountUsd ?? body.amount,
      category: body.category ?? "OTHER",
      date: body.date ? new Date(body.date) : new Date(),
      notes: body.notes ?? null,
      isPaid: body.isPaid ?? true,
      paidBy: body.paidBy ?? null,
    },
  });

  return NextResponse.json({ data: expense }, { status: 201 });
}
