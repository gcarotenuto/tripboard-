import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;

  const trips = await prisma.trip.findMany({
    where: { userId, deletedAt: null },
    select: {
      status: true,
      primaryDestination: true,
      destinations: true,
      startsAt: true,
      endsAt: true,
    },
  });

  const totalTrips = trips.length;
  const completedTrips = trips.filter((t) => t.status === "COMPLETED" || t.status === "ARCHIVED").length;

  // Count unique countries
  const countries = new Set<string>();
  for (const trip of trips) {
    // Parse destinations JSON
    try {
      const dests = JSON.parse((trip.destinations as unknown as string) || "[]") as Array<{ country?: string }>;
      for (const d of dests) {
        if (d.country) countries.add(d.country.trim());
      }
    } catch { /* ignore */ }

    // Fallback: extract country from primaryDestination "City, Country"
    if (trip.primaryDestination) {
      const parts = trip.primaryDestination.split(",");
      if (parts.length > 1) {
        countries.add(parts[parts.length - 1].trim());
      }
    }
  }

  // Total days traveled (sum of completed trips)
  let totalDays = 0;
  for (const trip of trips) {
    if (trip.startsAt && trip.endsAt) {
      const days = Math.round((new Date(trip.endsAt).getTime() - new Date(trip.startsAt).getTime()) / 86400000);
      if (days > 0) totalDays += days;
    }
  }

  return NextResponse.json({
    data: {
      totalTrips,
      completedTrips,
      countriesCount: countries.size,
      totalDays,
    },
  });
}
