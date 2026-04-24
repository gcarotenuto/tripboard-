import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/trips/demo — creates a sample trip with events for new users
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  // Check if the user already has trips (don't create demo if they do)
  const existing = await prisma.trip.count({ where: { userId, deletedAt: null } });
  if (existing > 0) {
    return NextResponse.json({ error: "Demo only available for new accounts" }, { status: 409 });
  }

  // Dates: start 3 weeks from now
  const start = new Date();
  start.setDate(start.getDate() + 21);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  const trip = await prisma.trip.create({
    data: {
      userId,
      title: "Tokyo Adventure 🇯🇵",
      description: "A sample trip to show you what TripBoard can do. Feel free to edit or delete it!",
      status: "UPCOMING",
      primaryDestination: "Tokyo, Japan",
      destinations: JSON.stringify([
        { city: "Tokyo", country: "Japan" },
        { city: "Kyoto", country: "Japan" },
      ]),
      tags: JSON.stringify(["japan", "asia", "culture", "food"]),
      startsAt: start,
      endsAt: end,
      timezone: "Asia/Tokyo",
    },
  });

  // Create sample events
  const day = (offset: number, hour: number, min = 0) => {
    const d = new Date(start);
    d.setDate(d.getDate() + offset);
    d.setHours(hour, min, 0, 0);
    return d;
  };

  await prisma.tripEvent.createMany({
    data: [
      // Day 0 — arrival
      {
        tripId: trip.id,
        title: "Flight to Tokyo (Narita)",
        type: "FLIGHT",
        emoji: "✈️",
        startsAt: day(0, 8, 30),
        endsAt: day(0, 14, 15),
        locationName: "Narita International Airport",
        notes: "Check-in 2h before. Seat 24A (window).",
      },
      {
        tripId: trip.id,
        title: "Check in — Shinjuku Hotel",
        type: "HOTEL",
        emoji: "🏨",
        startsAt: day(0, 16, 0),
        locationName: "Shinjuku, Tokyo",
        notes: "Confirmation #HTL-29182. Early check-in requested.",
      },

      // Day 1 — explore
      {
        tripId: trip.id,
        title: "Senso-ji Temple",
        type: "ACTIVITY",
        emoji: "⛩️",
        startsAt: day(1, 9, 0),
        endsAt: day(1, 11, 30),
        locationName: "Asakusa, Tokyo",
        notes: "Arrive early to avoid crowds. Try ningyo-yaki sweets!",
      },
      {
        tripId: trip.id,
        title: "Ramen at Ichiran",
        type: "FOOD",
        emoji: "🍜",
        startsAt: day(1, 12, 30),
        locationName: "Shibuya, Tokyo",
      },
      {
        tripId: trip.id,
        title: "Shibuya Crossing & Harajuku",
        type: "ACTIVITY",
        emoji: "🎌",
        startsAt: day(1, 14, 0),
        endsAt: day(1, 18, 0),
        locationName: "Shibuya, Tokyo",
      },

      // Day 2 — day trip
      {
        tripId: trip.id,
        title: "Shinkansen to Kyoto",
        type: "TRAIN",
        emoji: "🚄",
        startsAt: day(2, 8, 0),
        endsAt: day(2, 10, 15),
        locationName: "Tokyo Station → Kyoto Station",
        notes: "Nozomi 17, car 3, seat 12C.",
      },
      {
        tripId: trip.id,
        title: "Fushimi Inari Shrine",
        type: "ACTIVITY",
        emoji: "🦊",
        startsAt: day(2, 11, 0),
        endsAt: day(2, 14, 0),
        locationName: "Fushimi-ku, Kyoto",
      },
      {
        tripId: trip.id,
        title: "Kaiseki Dinner",
        type: "RESTAURANT",
        emoji: "🍱",
        startsAt: day(2, 19, 0),
        locationName: "Gion, Kyoto",
        notes: "Reservation at 19:00, 2 people.",
      },

      // Day 5 — departure
      {
        tripId: trip.id,
        title: "Flight home",
        type: "FLIGHT",
        emoji: "✈️",
        startsAt: day(5, 11, 45),
        locationName: "Haneda Airport, Tokyo",
        notes: "Allow 3h for airport transfer and check-in.",
      },
    ],
  });

  return NextResponse.json({ data: { id: trip.id } }, { status: 201 });
}
