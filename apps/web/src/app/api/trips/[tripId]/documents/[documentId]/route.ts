import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: { tripId: string; documentId: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const trip = await prisma.trip.findFirst({
    where: { id: params.tripId, userId, deletedAt: null },
  });
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const document = await prisma.document.findFirst({
    where: { id: params.documentId, tripId: params.tripId },
  });
  if (!document) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Soft-delete: set deletedAt timestamp
  await prisma.document.update({
    where: { id: params.documentId },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ data: { deleted: true } });
}
