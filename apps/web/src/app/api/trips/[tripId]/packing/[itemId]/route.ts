import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { tripId: string; itemId: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const trip = await prisma.trip.findFirst({ where: { id: params.tripId, userId } });
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const packingList = await prisma.packingList.findUnique({ where: { tripId: params.tripId } });
  if (!packingList) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const item = await prisma.packingItem.findFirst({
    where: { id: params.itemId, listId: packingList.id },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { isPacked, name, category, quantity, notes, order } = body;

  const updated = await prisma.packingItem.update({
    where: { id: params.itemId },
    data: {
      ...(isPacked !== undefined && { isPacked }),
      ...(name !== undefined && { name }),
      ...(category !== undefined && { category }),
      ...(quantity !== undefined && { quantity }),
      ...(notes !== undefined && { notes }),
      ...(order !== undefined && { order }),
    },
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { tripId: string; itemId: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const trip = await prisma.trip.findFirst({ where: { id: params.tripId, userId } });
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const packingList = await prisma.packingList.findUnique({ where: { tripId: params.tripId } });
  if (!packingList) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const item = await prisma.packingItem.findFirst({
    where: { id: params.itemId, listId: packingList.id },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.packingItem.delete({ where: { id: params.itemId } });

  return NextResponse.json({ data: { deleted: true } });
}
