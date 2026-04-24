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

  // Get or create the packing list
  let packingList = await prisma.packingList.findUnique({
    where: { tripId: params.tripId },
    include: { items: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] } },
  });

  if (!packingList) {
    packingList = await prisma.packingList.create({
      data: { tripId: params.tripId },
      include: { items: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] } },
    });
  }

  return NextResponse.json({ data: packingList });
}

export async function POST(req: Request, { params }: { params: { tripId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const trip = await prisma.trip.findFirst({ where: { id: params.tripId, userId } });
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { name, category, quantity, notes } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  // Ensure packing list exists
  let packingList = await prisma.packingList.findUnique({ where: { tripId: params.tripId } });
  if (!packingList) {
    packingList = await prisma.packingList.create({ data: { tripId: params.tripId } });
  }

  // Count existing items in this category to set order
  const categoryCount = await prisma.packingItem.count({
    where: { listId: packingList.id, category: category ?? "OTHER" },
  });

  const item = await prisma.packingItem.create({
    data: {
      listId: packingList.id,
      name: name.trim(),
      category: category ?? "OTHER",
      quantity: quantity ?? 1,
      notes: notes ?? null,
      order: categoryCount,
    },
  });

  return NextResponse.json({ data: item }, { status: 201 });
}
