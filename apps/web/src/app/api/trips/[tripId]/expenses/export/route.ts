import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { tripId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;

  const trip = await prisma.trip.findFirst({
    where: { id: params.tripId, userId, deletedAt: null },
    select: { id: true, title: true },
  });
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const expenses = await prisma.expense.findMany({
    where: { tripId: params.tripId },
    orderBy: { date: "asc" },
    select: {
      title: true, amount: true, currency: true,
      category: true, date: true, notes: true,
      paidBy: true, isPaid: true,
    },
  });

  // Build CSV
  const header = ["Title", "Amount", "Currency", "Category", "Date", "Paid By", "Paid", "Notes"];
  const rows = expenses.map((e) => [
    csv(e.title),
    csv(String(Number(e.amount).toFixed(2))),
    csv(e.currency ?? "USD"),
    csv(e.category ?? ""),
    csv(e.date ? new Date(e.date).toISOString().split("T")[0] : ""),
    csv(e.paidBy ?? ""),
    csv(e.isPaid ? "Yes" : "No"),
    csv(e.notes ?? ""),
  ]);

  const csvContent = [header, ...rows].map((row) => row.join(",")).join("\r\n");
  const filename = `${trip.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-expenses.csv`;

  return new Response(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

function csv(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
