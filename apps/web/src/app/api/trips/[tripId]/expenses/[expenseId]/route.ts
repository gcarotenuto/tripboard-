import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { tripId: string; expenseId: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const trip = await prisma.trip.findFirst({
    where: { id: params.tripId, userId, deletedAt: null },
  });
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const expense = await prisma.expense.findFirst({
    where: { id: params.expenseId, tripId: params.tripId },
  });
  if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { amount, currency, category, description, date, notes, isPaid } = body;

  const updated = await prisma.expense.update({
    where: { id: params.expenseId },
    data: {
      ...(amount !== undefined && { amount }),
      ...(currency !== undefined && { currency }),
      ...(category !== undefined && { category }),
      ...(description !== undefined && { description }),
      ...(date !== undefined && { date: new Date(date) }),
      ...(notes !== undefined && { notes }),
      ...(isPaid !== undefined && { isPaid }),
    },
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { tripId: string; expenseId: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const trip = await prisma.trip.findFirst({
    where: { id: params.tripId, userId, deletedAt: null },
  });
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const expense = await prisma.expense.findFirst({
    where: { id: params.expenseId, tripId: params.tripId },
  });
  if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.expense.delete({
    where: { id: params.expenseId },
  });

  return NextResponse.json({ data: { deleted: true } });
}
