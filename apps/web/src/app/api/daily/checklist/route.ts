import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { tripId, date, checklist } = await req.json();
  const board = await prisma.dailyBoard.upsert({
    where: { tripId_date: { tripId, date: new Date(date) } },
    update: { checklist: JSON.stringify(checklist) },
    create: { tripId, date: new Date(date), checklist: JSON.stringify(checklist), reminders: "[]" },
  });
  return NextResponse.json({ data: board });
}
