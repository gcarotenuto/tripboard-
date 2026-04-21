import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding TripBoard database...");

  const user = await prisma.user.upsert({
    where: { email: "demo@tripboard.app" },
    update: {},
    create: {
      email: "demo@tripboard.app",
      name: "Alex Traveler",
      emailVerified: new Date(),
      preferences: JSON.stringify({
        theme: "dark", currency: "EUR", timezone: "Europe/Rome",
        language: "en", defaultView: "logistics",
      }),
    },
  });
  console.log(`✅ User: ${user.email}`);

  const japanTrip = await prisma.trip.create({
    data: {
      userId: user.id,
      title: "Japan Golden Week",
      description: "Two weeks exploring Tokyo, Kyoto, Osaka, and Hiroshima.",
      status: "UPCOMING",
      startsAt: new Date("2026-04-25T08:00:00Z"),
      endsAt: new Date("2026-05-09T22:00:00Z"),
      timezone: "Asia/Tokyo",
      primaryDestination: "Tokyo, Japan",
      destinations: JSON.stringify([
        { city: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503 },
        { city: "Kyoto", country: "Japan", lat: 35.0116, lng: 135.7681 },
        { city: "Osaka", country: "Japan", lat: 34.6937, lng: 135.5023 },
      ]),
      tags: JSON.stringify(["asia", "culture", "food", "spring"]),
    },
  });

  const italyTrip = await prisma.trip.create({
    data: {
      userId: user.id,
      title: "Amalfi Coast & Rome",
      status: "COMPLETED",
      startsAt: new Date("2025-09-05T06:00:00Z"),
      endsAt: new Date("2025-09-15T21:00:00Z"),
      timezone: "Europe/Rome",
      primaryDestination: "Rome, Italy",
      destinations: JSON.stringify([{ city: "Rome", country: "Italy" }, { city: "Positano", country: "Italy" }]),
      tags: JSON.stringify(["europe", "culture", "food", "coast"]),
      memoryCapsule: JSON.stringify({
        summary: "An unforgettable 10 days through ancient Rome and the stunning Amalfi Coast.",
        highlights: ["Private Colosseum tour at sunrise", "Boat trip to Capri", "Pasta class in Naples"],
        stats: { totalDays: 10, citiesVisited: 5, totalExpenses: 2840, currency: "EUR", journalEntries: 3 },
        generatedAt: "2025-09-16T10:00:00Z",
      }),
    },
  });

  await prisma.trip.create({
    data: {
      userId: user.id,
      title: "Morocco Desert Adventure",
      status: "PLANNING",
      startsAt: new Date("2026-10-10T00:00:00Z"),
      endsAt: new Date("2026-10-20T00:00:00Z"),
      timezone: "Africa/Casablanca",
      primaryDestination: "Marrakech, Morocco",
      destinations: JSON.stringify([{ city: "Marrakech", country: "Morocco" }]),
      tags: JSON.stringify(["africa", "desert", "adventure"]),
    },
  });
  console.log(`✅ Trips: 3 created`);

  await prisma.tripEvent.createMany({
    data: [
      {
        tripId: japanTrip.id, title: "Flight LH714: Frankfurt → Tokyo Haneda",
        type: "FLIGHT", view: "LOGISTICS",
        startsAt: new Date("2026-04-25T08:20:00Z"), endsAt: new Date("2026-04-26T06:45:00Z"),
        timezone: "Europe/Berlin", locationName: "Frankfurt Airport (FRA)",
        details: JSON.stringify({ flightNumber: "LH714", airline: "Lufthansa", bookingRef: "LHXYZ123", seat: "14A" }),
        sourceType: "email", confidence: 0.97,
      },
      {
        tripId: japanTrip.id, title: "Check in: Shinjuku Granbell Hotel",
        type: "HOTEL", view: "LOGISTICS",
        startsAt: new Date("2026-04-26T15:00:00Z"), endsAt: new Date("2026-05-02T11:00:00Z"),
        timezone: "Asia/Tokyo", locationName: "Shinjuku Granbell Hotel",
        locationLat: 35.6938, locationLng: 139.7034,
        details: JSON.stringify({ confirmationNumber: "GRAN-2026-88821", nights: 6, roomType: "Deluxe King" }),
        sourceType: "pdf", confidence: 0.94,
      },
      {
        tripId: japanTrip.id, title: "Fushimi Inari Taisha",
        type: "ACTIVITY", view: "BOTH",
        startsAt: new Date("2026-05-03T06:00:00Z"), endsAt: new Date("2026-05-03T10:00:00Z"),
        timezone: "Asia/Tokyo", locationName: "Fushimi Inari Taisha",
        locationLat: 34.9671, locationLng: 135.7727,
        details: JSON.stringify({ admission: "free" }), sourceType: "manual", confidence: 1.0,
      },
    ],
  });
  console.log(`✅ Events: 3 created`);

  await prisma.document.createMany({
    data: [
      {
        userId: user.id, tripId: japanTrip.id, filename: "LH714_booking.pdf",
        mimeType: "application/pdf", fileSize: 142880,
        storageKey: "demo/LH714_booking.pdf", type: "BOOKING_CONFIRMATION",
        status: "EXTRACTED", source: "PDF_UPLOAD",
        extractedData: JSON.stringify({ flightNumber: "LH714", bookingRef: "LHXYZ123" }),
        extractionModel: "claude-sonnet-4-6", extractionConfidence: 0.97,
        tags: JSON.stringify(["flight", "lufthansa"]),
      },
      {
        userId: user.id, tripId: japanTrip.id, filename: "shinjuku_hotel.pdf",
        mimeType: "application/pdf", fileSize: 98340,
        storageKey: "demo/shinjuku_hotel.pdf", type: "HOTEL_VOUCHER",
        status: "EXTRACTED", source: "EMAIL_FORWARD",
        extractedData: JSON.stringify({ hotel: "Shinjuku Granbell", nights: 6 }),
        extractionModel: "claude-sonnet-4-6", extractionConfidence: 0.94,
        tags: JSON.stringify(["hotel", "tokyo"]),
      },
      {
        userId: user.id, tripId: japanTrip.id, filename: "japan_rail_pass.pdf",
        mimeType: "application/pdf", fileSize: 65120,
        storageKey: "demo/japan_rail_pass.pdf", type: "OTHER",
        status: "PENDING", source: "PDF_UPLOAD", tags: JSON.stringify(["rail-pass"]),
      },
    ],
  });
  console.log(`✅ Documents: 3 created`);

  await prisma.expense.createMany({
    data: [
      { userId: user.id, tripId: italyTrip.id, title: "Colosseum tickets", amount: 52, currency: "EUR", category: "ACTIVITIES", date: new Date("2025-09-06"), isPaid: true },
      { userId: user.id, tripId: italyTrip.id, title: "Hotel Roma — 3 nights", amount: 420, currency: "EUR", category: "ACCOMMODATION", date: new Date("2025-09-05"), isPaid: true },
      { userId: user.id, tripId: italyTrip.id, title: "Dinner Il Sorpasso", amount: 78, currency: "EUR", category: "FOOD", date: new Date("2025-09-07"), isPaid: true },
      { userId: user.id, tripId: italyTrip.id, title: "Train Roma → Naples", amount: 35, currency: "EUR", category: "TRANSPORT", date: new Date("2025-09-09"), isPaid: true },
      { userId: user.id, tripId: italyTrip.id, title: "Boat trip to Capri", amount: 120, currency: "EUR", category: "ACTIVITIES", date: new Date("2025-09-13"), isPaid: true },
      { userId: user.id, tripId: italyTrip.id, title: "Le Sirenuse Hotel — 3 nights", amount: 1260, currency: "EUR", category: "ACCOMMODATION", date: new Date("2025-09-11"), isPaid: true },
      { userId: user.id, tripId: italyTrip.id, title: "Pasta making class", amount: 95, currency: "EUR", category: "ACTIVITIES", date: new Date("2025-09-10"), isPaid: true },
      { userId: user.id, tripId: italyTrip.id, title: "Souvenirs & shopping", amount: 215, currency: "EUR", category: "SHOPPING", date: new Date("2025-09-14"), isPaid: true },
    ],
  });
  console.log(`✅ Expenses: 8 created`);

  await prisma.journalEntry.createMany({
    data: [
      {
        userId: user.id, tripId: italyTrip.id, title: "Day 1 — Arrival in Rome",
        content: "The smell of espresso and old stone hits you the moment you step out of Termini. Found a tiny bar and had the best cornetto of my life standing at the counter like a local.",
        mood: "😍", entryDate: new Date("2025-09-05"),
      },
      {
        userId: user.id, tripId: italyTrip.id, title: "Day 2 — Colosseum at dawn",
        content: "Woke up at 5:30 for early entry. Worth every second of lost sleep. The light was gold and the place was nearly empty.",
        mood: "🏛️", entryDate: new Date("2025-09-06"),
      },
      {
        userId: user.id, tripId: italyTrip.id, title: "Day 7 — Positano",
        content: "Nothing prepares you for Positano. The town is almost vertical — steps everywhere, lemons the size of softballs, boats bobbing in a turquoise bay.",
        mood: "🍋", entryDate: new Date("2025-09-11"),
      },
    ],
  });
  console.log(`✅ Journal: 3 entries`);

  await prisma.dailyBoard.create({
    data: {
      tripId: japanTrip.id, date: new Date("2026-04-26"),
      morningBriefing: "Your flight LH714 lands at Haneda at 06:45. Take the Keikyu Line to Shinjuku. Check-in from 15:00.",
      checklist: JSON.stringify([
        { id: "1", text: "Exchange yen at airport", done: false, order: 1 },
        { id: "2", text: "Pick up IC card (Suica/Pasmo)", done: false, order: 2 },
        { id: "3", text: "Pocket WiFi at Haneda arrivals", done: false, order: 3 },
        { id: "4", text: "Check in Shinjuku Granbell (from 15:00)", done: false, order: 4 },
      ]),
      reminders: JSON.stringify([
        { id: "1", text: "Japan Rail Pass must be exchanged within 90 days of issue", acknowledged: false },
      ]),
    },
  });
  console.log(`✅ Daily Board: 1 created`);

  // Demo credentials: hash password for credentials login
  const bcrypt = await import("bcryptjs");
  const hash = await bcrypt.hash("demo1234", 10);
  await prisma.account.upsert({
    where: { provider_providerAccountId: { provider: "credentials", providerAccountId: user.id } },
    update: { access_token: hash },
    create: {
      userId: user.id, type: "credentials", provider: "credentials",
      providerAccountId: user.id, access_token: hash,
    },
  });

  console.log("\n🎉 Seed complete!");
  console.log("   Login: demo@tripboard.app / demo1234");
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
