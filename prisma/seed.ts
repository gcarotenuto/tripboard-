import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding TripBoard database...");

  // Clean slate
  await prisma.dailyBoard.deleteMany();
  await prisma.journalEntry.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.tripEvent.deleteMany();
  await prisma.document.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  const bcrypt = await import("bcryptjs");
  const hash = await bcrypt.hash("demo1234", 10);

  const user = await prisma.user.create({
    data: {
      email: "demo@tripboard.app",
      name: "Alex Traveler",
      emailVerified: new Date(),
      preferences: JSON.stringify({ theme: "dark", currency: "EUR", timezone: "Europe/Rome", language: "en", defaultView: "logistics" }),
      accounts: {
        create: {
          type: "credentials", provider: "credentials",
          providerAccountId: "demo", access_token: hash,
        },
      },
    },
  });
  console.log(`✅ User: ${user.email}`);

  // ─── TRIP 1: Japan Golden Week (UPCOMING) ─────────────────────────────
  const japan = await prisma.trip.create({
    data: {
      userId: user.id,
      title: "Japan Golden Week",
      description: "Two weeks exploring Tokyo, Kyoto, Osaka, and Hiroshima during cherry blossom season.",
      status: "UPCOMING",
      startsAt: new Date("2026-04-25T08:20:00Z"),
      endsAt: new Date("2026-05-09T22:00:00Z"),
      timezone: "Asia/Tokyo",
      primaryDestination: "Tokyo, Japan",
      destinations: JSON.stringify([
        { city: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503 },
        { city: "Kyoto", country: "Japan", lat: 35.0116, lng: 135.7681 },
        { city: "Osaka", country: "Japan", lat: 34.6937, lng: 135.5023 },
        { city: "Hiroshima", country: "Japan", lat: 34.3853, lng: 132.4553 },
      ]),
      tags: JSON.stringify(["asia", "culture", "food", "spring", "temples"]),
    },
  });

  await prisma.tripEvent.createMany({ data: [
    {
      tripId: japan.id, title: "Flight LH714: Frankfurt → Tokyo Haneda",
      type: "FLIGHT", view: "LOGISTICS",
      startsAt: new Date("2026-04-25T08:20:00Z"), endsAt: new Date("2026-04-26T06:45:00Z"),
      timezone: "Europe/Berlin", locationName: "Frankfurt Airport (FRA)",
      details: JSON.stringify({ flightNumber: "LH714", airline: "Lufthansa", bookingRef: "LHXYZ123", seat: "14A", terminal: "1" }),
      sourceType: "email", confidence: 0.97,
    },
    {
      tripId: japan.id, title: "Shinjuku Granbell Hotel — Check-in",
      type: "HOTEL", view: "LOGISTICS",
      startsAt: new Date("2026-04-26T15:00:00Z"), endsAt: new Date("2026-05-02T11:00:00Z"),
      timezone: "Asia/Tokyo", locationName: "Shinjuku Granbell Hotel",
      locationLat: 35.6938, locationLng: 139.7034,
      details: JSON.stringify({ confirmationNumber: "GRAN-88821", nights: 6, roomType: "Deluxe King", breakfast: false }),
      sourceType: "pdf", confidence: 0.94,
    },
    {
      tripId: japan.id, title: "Tsukiji Outer Market — Breakfast",
      type: "FOOD", view: "MOMENTS",
      startsAt: new Date("2026-04-27T07:00:00Z"), endsAt: new Date("2026-04-27T09:00:00Z"),
      timezone: "Asia/Tokyo", locationName: "Tsukiji Outer Market",
      locationLat: 35.6654, locationLng: 139.7707,
      details: JSON.stringify({ notes: "Best tuna sashimi at stall 6-23" }),
      sourceType: "manual", confidence: 1.0,
    },
    {
      tripId: japan.id, title: "teamLab Planets TOYOSU",
      type: "ACTIVITY", view: "MOMENTS",
      startsAt: new Date("2026-04-28T14:00:00Z"), endsAt: new Date("2026-04-28T17:00:00Z"),
      timezone: "Asia/Tokyo", locationName: "teamLab Planets TOYOSU",
      locationLat: 35.6506, locationLng: 139.7950,
      details: JSON.stringify({ ticketRef: "TLP-20260428", admission: 3200 }),
      sourceType: "manual", confidence: 1.0,
    },
    {
      tripId: japan.id, title: "Shinkansen: Tokyo → Kyoto",
      type: "TRAIN", view: "LOGISTICS",
      startsAt: new Date("2026-05-02T09:30:00Z"), endsAt: new Date("2026-05-02T12:15:00Z"),
      timezone: "Asia/Tokyo", locationName: "Tokyo Station",
      details: JSON.stringify({ trainNumber: "Nozomi 15", carriage: "7", seat: "12A", bookingRef: "JR-2026-55421" }),
      sourceType: "manual", confidence: 1.0,
    },
    {
      tripId: japan.id, title: "Fushimi Inari Taisha — Sunrise hike",
      type: "ACTIVITY", view: "BOTH",
      startsAt: new Date("2026-05-03T05:30:00Z"), endsAt: new Date("2026-05-03T09:00:00Z"),
      timezone: "Asia/Tokyo", locationName: "Fushimi Inari Taisha",
      locationLat: 34.9671, locationLng: 135.7727,
      details: JSON.stringify({ admission: "free", tip: "Go before 6am to beat the crowds" }),
      sourceType: "manual", confidence: 1.0,
    },
    {
      tripId: japan.id, title: "Nishiki Market food crawl",
      type: "FOOD", view: "MOMENTS",
      startsAt: new Date("2026-05-03T12:00:00Z"), endsAt: new Date("2026-05-03T14:30:00Z"),
      timezone: "Asia/Tokyo", locationName: "Nishiki Market, Kyoto",
      locationLat: 35.0050, locationLng: 135.7650,
      details: JSON.stringify({ notes: "Pickled vegetables, tamagoyaki, fresh mochi" }),
      sourceType: "manual", confidence: 1.0,
    },
    {
      tripId: japan.id, title: "Arashiyama Bamboo Grove",
      type: "ACTIVITY", view: "MOMENTS",
      startsAt: new Date("2026-05-04T07:00:00Z"), endsAt: new Date("2026-05-04T10:00:00Z"),
      timezone: "Asia/Tokyo", locationName: "Arashiyama Bamboo Grove",
      locationLat: 35.0094, locationLng: 135.6720,
      details: JSON.stringify({ admission: "free" }),
      sourceType: "manual", confidence: 1.0,
    },
    {
      tripId: japan.id, title: "Hiroshima — Peace Memorial Museum",
      type: "ACTIVITY", view: "BOTH",
      startsAt: new Date("2026-05-06T10:00:00Z"), endsAt: new Date("2026-05-06T13:00:00Z"),
      timezone: "Asia/Tokyo", locationName: "Hiroshima Peace Memorial Museum",
      locationLat: 34.3954, locationLng: 132.4530,
      details: JSON.stringify({ admission: 200 }),
      sourceType: "manual", confidence: 1.0,
    },
    {
      tripId: japan.id, title: "Flight NH224: Osaka → Frankfurt",
      type: "FLIGHT", view: "LOGISTICS",
      startsAt: new Date("2026-05-09T13:45:00Z"), endsAt: new Date("2026-05-09T19:30:00Z"),
      timezone: "Asia/Tokyo", locationName: "Kansai International Airport (KIX)",
      details: JSON.stringify({ flightNumber: "NH224", airline: "ANA", bookingRef: "ANAXYZ789", seat: "22C" }),
      sourceType: "email", confidence: 0.95,
    },
  ]});

  await prisma.document.createMany({ data: [
    {
      userId: user.id, tripId: japan.id, filename: "LH714_booking.pdf",
      mimeType: "application/pdf", fileSize: 142880,
      storageKey: "demo/LH714_booking.pdf", type: "BOOKING_CONFIRMATION",
      status: "EXTRACTED", source: "EMAIL_FORWARD",
      extractedData: JSON.stringify({ flightNumber: "LH714", bookingRef: "LHXYZ123" }),
      extractionModel: "claude-sonnet-4-6", extractionConfidence: 0.97,
      tags: JSON.stringify(["flight", "lufthansa"]),
    },
    {
      userId: user.id, tripId: japan.id, filename: "shinjuku_hotel.pdf",
      mimeType: "application/pdf", fileSize: 98340,
      storageKey: "demo/shinjuku_hotel.pdf", type: "HOTEL_VOUCHER",
      status: "EXTRACTED", source: "PDF_UPLOAD",
      extractedData: JSON.stringify({ hotel: "Shinjuku Granbell", nights: 6 }),
      extractionModel: "claude-sonnet-4-6", extractionConfidence: 0.94,
      tags: JSON.stringify(["hotel", "tokyo"]),
    },
    {
      userId: user.id, tripId: japan.id, filename: "japan_rail_pass.pdf",
      mimeType: "application/pdf", fileSize: 65120,
      storageKey: "demo/japan_rail_pass.pdf", type: "OTHER",
      status: "PENDING", source: "PDF_UPLOAD",
      tags: JSON.stringify(["rail-pass", "transport"]),
    },
  ]});

  await prisma.dailyBoard.createMany({ data: [
    {
      tripId: japan.id, date: new Date("2026-04-26"),
      morningBriefing: "Flight LH714 lands at Haneda at 06:45. Take the Keikyu Line to Shinjuku (~90 min). Check-in from 15:00. Rest day — jet lag is real.",
      checklist: JSON.stringify([
        { id: "1", text: "Exchange ¥50,000 at airport", done: false, order: 1 },
        { id: "2", text: "Pick up IC card (Suica) at Keikyu station", done: false, order: 2 },
        { id: "3", text: "Collect Pocket WiFi at Haneda arrivals", done: false, order: 3 },
        { id: "4", text: "Check in Shinjuku Granbell (from 15:00)", done: false, order: 4 },
        { id: "5", text: "Konbini dinner — explore Shinjuku at night", done: false, order: 5 },
      ]),
      reminders: JSON.stringify([
        { id: "1", text: "Japan Rail Pass must be exchanged within 90 days of issue date", acknowledged: false },
        { id: "2", text: "Tip: Download Google Maps offline for Tokyo before landing", acknowledged: false },
      ]),
    },
    {
      tripId: japan.id, date: new Date("2026-04-27"),
      morningBriefing: "First full day in Tokyo. Start with Tsukiji market at 7am for the freshest breakfast of your life, then head to Shibuya crossing and Harajuku.",
      checklist: JSON.stringify([
        { id: "1", text: "Tsukiji Outer Market breakfast (7:00)", done: false, order: 1 },
        { id: "2", text: "Shibuya crossing & Hachiko statue", done: false, order: 2 },
        { id: "3", text: "Meiji Shrine", done: false, order: 3 },
        { id: "4", text: "Harajuku Takeshita Street", done: false, order: 4 },
        { id: "5", text: "Dinner in Shinjuku Golden Gai", done: false, order: 5 },
      ]),
      reminders: JSON.stringify([]),
    },
  ]});

  console.log(`✅ Japan trip: 10 events, 3 docs, 2 daily boards`);

  // ─── TRIP 2: Amalfi Coast & Rome (COMPLETED) ──────────────────────────
  const italy = await prisma.trip.create({
    data: {
      userId: user.id,
      title: "Amalfi Coast & Rome",
      description: "10 unforgettable days through ancient Rome and the breathtaking Amalfi Coast.",
      status: "COMPLETED",
      startsAt: new Date("2025-09-05T06:00:00Z"),
      endsAt: new Date("2025-09-15T21:00:00Z"),
      timezone: "Europe/Rome",
      primaryDestination: "Rome, Italy",
      destinations: JSON.stringify([
        { city: "Rome", country: "Italy", lat: 41.9028, lng: 12.4964 },
        { city: "Naples", country: "Italy", lat: 40.8518, lng: 14.2681 },
        { city: "Positano", country: "Italy", lat: 40.6280, lng: 14.4850 },
      ]),
      tags: JSON.stringify(["europe", "culture", "food", "coast", "history"]),
      memoryCapsule: JSON.stringify({
        summary: "An unforgettable 10 days through ancient Rome and the stunning Amalfi Coast.",
        highlights: ["Private Colosseum tour at sunrise", "Boat trip to Capri", "Pasta class in Naples"],
        stats: { totalDays: 10, citiesVisited: 4, totalExpenses: 2840, currency: "EUR", journalEntries: 4 },
        generatedAt: "2025-09-16T10:00:00Z",
      }),
    },
  });

  await prisma.tripEvent.createMany({ data: [
    {
      tripId: italy.id, title: "Flight FR1234: Dublin → Rome Fiumicino",
      type: "FLIGHT", view: "LOGISTICS",
      startsAt: new Date("2025-09-05T06:15:00Z"), endsAt: new Date("2025-09-05T10:30:00Z"),
      timezone: "Europe/Dublin", locationName: "Dublin Airport (DUB)",
      details: JSON.stringify({ flightNumber: "FR1234", airline: "Ryanair", bookingRef: "RYABC1", seat: "18F" }),
      sourceType: "email", confidence: 0.99,
    },
    {
      tripId: italy.id, title: "Hotel Artemide Rome — Check-in",
      type: "HOTEL", view: "LOGISTICS",
      startsAt: new Date("2025-09-05T14:00:00Z"), endsAt: new Date("2025-09-09T11:00:00Z"),
      timezone: "Europe/Rome", locationName: "Hotel Artemide, Via Nazionale 22",
      locationLat: 41.9022, locationLng: 12.4967,
      details: JSON.stringify({ confirmationNumber: "ART-2025-4421", nights: 4, roomType: "Superior Double" }),
      sourceType: "pdf", confidence: 0.96,
    },
    {
      tripId: italy.id, title: "Colosseum — Private sunrise tour",
      type: "ACTIVITY", view: "BOTH",
      startsAt: new Date("2025-09-06T06:30:00Z"), endsAt: new Date("2025-09-06T09:00:00Z"),
      timezone: "Europe/Rome", locationName: "Colosseum, Piazza del Colosseo",
      locationLat: 41.8902, locationLng: 12.4922,
      details: JSON.stringify({ ticketRef: "COL-SUNRISE-1234", guide: "Marco Rossi", admission: 45 }),
      sourceType: "manual", confidence: 1.0, emoji: "🏛️",
    },
    {
      tripId: italy.id, title: "Cacio e Pepe at Da Enzo al 29",
      type: "FOOD", view: "MOMENTS",
      startsAt: new Date("2025-09-06T20:00:00Z"), endsAt: new Date("2025-09-06T22:00:00Z"),
      timezone: "Europe/Rome", locationName: "Da Enzo al 29, Trastevere",
      locationLat: 41.8876, locationLng: 12.4699,
      details: JSON.stringify({ reservation: true, notes: "Ordered cacio e pepe and artichokes alla romana" }),
      sourceType: "manual", confidence: 1.0, emoji: "🍝",
    },
    {
      tripId: italy.id, title: "Vatican Museums & Sistine Chapel",
      type: "ACTIVITY", view: "BOTH",
      startsAt: new Date("2025-09-07T09:00:00Z"), endsAt: new Date("2025-09-07T13:30:00Z"),
      timezone: "Europe/Rome", locationName: "Vatican Museums",
      locationLat: 41.9065, locationLng: 12.4536,
      details: JSON.stringify({ ticketRef: "VAT-20250907", admission: 27, skipLine: true }),
      sourceType: "manual", confidence: 1.0,
    },
    {
      tripId: italy.id, title: "Train Roma Termini → Napoli Centrale",
      type: "TRAIN", view: "LOGISTICS",
      startsAt: new Date("2025-09-09T10:30:00Z"), endsAt: new Date("2025-09-09T11:48:00Z"),
      timezone: "Europe/Rome", locationName: "Roma Termini",
      details: JSON.stringify({ trainNumber: "FR9508", operator: "Italo", seat: "4B", bookingRef: "ITALO-221B" }),
      sourceType: "email", confidence: 0.93,
    },
    {
      tripId: italy.id, title: "Pasta-making class — Spaghetti alle Vongole",
      type: "ACTIVITY", view: "MOMENTS",
      startsAt: new Date("2025-09-10T10:00:00Z"), endsAt: new Date("2025-09-10T13:00:00Z"),
      timezone: "Europe/Rome", locationName: "Cucina Carmela, Spaccanapoli Naples",
      locationLat: 40.8496, locationLng: 14.2562,
      details: JSON.stringify({ host: "Carmela Esposito", groupSize: 8, admission: 95 }),
      sourceType: "manual", confidence: 1.0, emoji: "👨‍🍳",
    },
    {
      tripId: italy.id, title: "Le Sirenuse Positano — Check-in",
      type: "HOTEL", view: "LOGISTICS",
      startsAt: new Date("2025-09-11T14:00:00Z"), endsAt: new Date("2025-09-14T11:00:00Z"),
      timezone: "Europe/Rome", locationName: "Le Sirenuse, Via Cristoforo Colombo 30",
      locationLat: 40.6281, locationLng: 14.4849,
      details: JSON.stringify({ confirmationNumber: "SIR-2025-GOLD", nights: 3, roomType: "Deluxe Sea View", breakfast: true }),
      sourceType: "pdf", confidence: 0.98,
    },
    {
      tripId: italy.id, title: "Boat trip to Capri & Blue Grotto",
      type: "ACTIVITY", view: "BOTH",
      startsAt: new Date("2025-09-13T09:00:00Z"), endsAt: new Date("2025-09-13T19:00:00Z"),
      timezone: "Europe/Rome", locationName: "Positano Marina Grande",
      locationLat: 40.6271, locationLng: 14.4841,
      details: JSON.stringify({ operator: "Capri Boat Tours", admission: 120, includes: ["Blue Grotto", "lunch", "snorkeling"] }),
      sourceType: "manual", confidence: 1.0, emoji: "⛵",
    },
  ]});

  await prisma.document.createMany({ data: [
    {
      userId: user.id, tripId: italy.id, filename: "Ryanair_FR1234.pdf",
      mimeType: "application/pdf", fileSize: 118200,
      storageKey: "demo/Ryanair_FR1234.pdf", type: "FLIGHT_TICKET",
      status: "EXTRACTED", source: "EMAIL_FORWARD",
      extractedData: JSON.stringify({ flightNumber: "FR1234", airline: "Ryanair", bookingRef: "RYABC1", departureDate: "2025-09-05", seat: "18F" }),
      extractionModel: "claude-sonnet-4-6", extractionConfidence: 0.99,
      tags: JSON.stringify(["flight", "ryanair"]),
    },
    {
      userId: user.id, tripId: italy.id, filename: "Hotel_Artemide_Rome.pdf",
      mimeType: "application/pdf", fileSize: 98400,
      storageKey: "demo/Hotel_Artemide_Rome.pdf", type: "HOTEL_VOUCHER",
      status: "EXTRACTED", source: "PDF_UPLOAD",
      extractedData: JSON.stringify({ hotel: "Hotel Artemide", confirmationNumber: "ART-2025-4421", checkIn: "2025-09-05", checkOut: "2025-09-09", nights: 4 }),
      extractionModel: "claude-sonnet-4-6", extractionConfidence: 0.96,
      tags: JSON.stringify(["hotel", "rome"]),
    },
    {
      userId: user.id, tripId: italy.id, filename: "Le_Sirenuse_Positano.pdf",
      mimeType: "application/pdf", fileSize: 142600,
      storageKey: "demo/Le_Sirenuse_Positano.pdf", type: "HOTEL_VOUCHER",
      status: "EXTRACTED", source: "PDF_UPLOAD",
      extractedData: JSON.stringify({ hotel: "Le Sirenuse", confirmationNumber: "SIR-2025-GOLD", checkIn: "2025-09-11", checkOut: "2025-09-14", nights: 3 }),
      extractionModel: "claude-sonnet-4-6", extractionConfidence: 0.98,
      tags: JSON.stringify(["hotel", "positano"]),
    },
    {
      userId: user.id, tripId: italy.id, filename: "Italo_Roma_Napoli.pdf",
      mimeType: "application/pdf", fileSize: 64200,
      storageKey: "demo/Italo_Roma_Napoli.pdf", type: "OTHER",
      status: "EXTRACTED", source: "EMAIL_FORWARD",
      extractedData: JSON.stringify({ operator: "Italo", trainNumber: "FR9508", bookingRef: "ITALO-221B", departureDate: "2025-09-09", seat: "4B" }),
      extractionModel: "claude-sonnet-4-6", extractionConfidence: 0.93,
      tags: JSON.stringify(["train", "italo"]),
    },
    {
      userId: user.id, tripId: italy.id, filename: "Colosseum_sunrise_tour.pdf",
      mimeType: "application/pdf", fileSize: 38100,
      storageKey: "demo/Colosseum_sunrise_tour.pdf", type: "BOOKING_CONFIRMATION",
      status: "REVIEWED", source: "MANUAL",
      extractedData: JSON.stringify({ attraction: "Colosseum", ticketRef: "COL-SUNRISE-1234", date: "2025-09-06", guide: "Marco Rossi" }),
      extractionModel: "claude-sonnet-4-6", extractionConfidence: 1.0,
      tags: JSON.stringify(["activity", "colosseum"]),
    },
  ]});

  await prisma.expense.createMany({ data: [
    { userId: user.id, tripId: italy.id, title: "Colosseum private tour", amount: 90, currency: "EUR", category: "ACTIVITIES", date: new Date("2025-09-06"), isPaid: true },
    { userId: user.id, tripId: italy.id, title: "Hotel Artemide — 4 nights", amount: 620, currency: "EUR", category: "ACCOMMODATION", date: new Date("2025-09-05"), isPaid: true },
    { userId: user.id, tripId: italy.id, title: "Da Enzo al 29 — dinner", amount: 68, currency: "EUR", category: "FOOD", date: new Date("2025-09-06"), isPaid: true },
    { userId: user.id, tripId: italy.id, title: "Vatican Museums tickets", amount: 54, currency: "EUR", category: "ACTIVITIES", date: new Date("2025-09-07"), isPaid: true },
    { userId: user.id, tripId: italy.id, title: "Gelato & coffee (Rome)", amount: 24, currency: "EUR", category: "FOOD", date: new Date("2025-09-08"), isPaid: true },
    { userId: user.id, tripId: italy.id, title: "Italo train Rome→Naples", amount: 35, currency: "EUR", category: "TRANSPORT", date: new Date("2025-09-09"), isPaid: true },
    { userId: user.id, tripId: italy.id, title: "Pasta making class", amount: 95, currency: "EUR", category: "ACTIVITIES", date: new Date("2025-09-10"), isPaid: true },
    { userId: user.id, tripId: italy.id, title: "Le Sirenuse — 3 nights", amount: 1260, currency: "EUR", category: "ACCOMMODATION", date: new Date("2025-09-11"), isPaid: true },
    { userId: user.id, tripId: italy.id, title: "Boat trip to Capri", amount: 120, currency: "EUR", category: "ACTIVITIES", date: new Date("2025-09-13"), isPaid: true },
    { userId: user.id, tripId: italy.id, title: "Limoncello & ceramics", amount: 145, currency: "EUR", category: "SHOPPING", date: new Date("2025-09-13"), isPaid: true },
    { userId: user.id, tripId: italy.id, title: "Positano restaurants (3 dinners)", amount: 210, currency: "EUR", category: "FOOD", date: new Date("2025-09-12"), isPaid: true },
    { userId: user.id, tripId: italy.id, title: "Ryanair flight home", amount: 119, currency: "EUR", category: "TRANSPORT", date: new Date("2025-09-15"), isPaid: true },
  ]});

  await prisma.journalEntry.createMany({ data: [
    {
      userId: user.id, tripId: italy.id,
      title: "Giorno 1 — Arrivo a Roma",
      content: "The smell of espresso and old stone hits you the moment you step out of Termini. Found a tiny bar near the hotel and had the best cornetto of my life standing at the counter like a local. Walked to the Trevi Fountain at midnight — only a handful of people, the light bouncing off the water. This city is alive in a way I can't fully explain.",
      mood: "😍", entryDate: new Date("2025-09-05"),
    },
    {
      userId: user.id, tripId: italy.id,
      title: "Giorno 2 — Colosseo all'alba",
      content: "Woke up at 5am for the private sunrise tour. The guide Marco met us at the gate — just six of us inside that ancient arena as the light turned gold. Standing in the arena floor looking up at 50,000 empty seats, you feel the weight of history physically. Later stumbled into a perfect trattoria in Trastevere. Ate cacio e pepe and drank the house wine until they started turning the lights off.",
      mood: "🏛️", entryDate: new Date("2025-09-06"),
    },
    {
      userId: user.id, tripId: italy.id,
      title: "Giorno 6 — Napoli e la pasta",
      content: "Naples is chaotic and alive and slightly terrifying and I am completely in love with it. Carmela's cooking class was 3 hours of flour, chaos, and spaghetti alle vongole that tasted like the sea. She yelled at me twice for over-salting the water and I have never felt more seen. The pizza margherita at Di Matteo afterward cost €3 and I would trade any Michelin-star dinner for it.",
      mood: "🍕", entryDate: new Date("2025-09-10"),
    },
    {
      userId: user.id, tripId: italy.id,
      title: "Giorno 7 — Positano",
      content: "Nothing prepares you for Positano. The town is almost vertical — steps everywhere, lemons the size of softballs, boats bobbing in a turquoise bay. We sat on the terrace at Le Sirenuse and ordered Aperol spritzes as the sun dropped behind the cliffs. The boat to Capri tomorrow is already dreading to be over. I don't want to leave.",
      mood: "🍋", entryDate: new Date("2025-09-11"),
    },
  ]});

  console.log(`✅ Italy trip: 9 events, 12 expenses, 4 journal entries`);

  // ─── TRIP 3: Portugal Road Trip (ACTIVE) ──────────────────────────────
  const portugal = await prisma.trip.create({
    data: {
      userId: user.id,
      title: "Portugal Road Trip",
      description: "Two weeks driving from Lisbon to Porto along the Atlantic coast.",
      status: "ACTIVE",
      startsAt: new Date("2026-04-14T10:00:00Z"),
      endsAt: new Date("2026-04-28T20:00:00Z"),
      timezone: "Europe/Lisbon",
      primaryDestination: "Lisbon, Portugal",
      destinations: JSON.stringify([
        { city: "Lisbon", country: "Portugal", lat: 38.7169, lng: -9.1395 },
        { city: "Sintra", country: "Portugal", lat: 38.7978, lng: -9.3895 },
        { city: "Algarve", country: "Portugal", lat: 37.0194, lng: -7.9322 },
        { city: "Porto", country: "Portugal", lat: 41.1579, lng: -8.6291 },
      ]),
      tags: JSON.stringify(["europe", "roadtrip", "ocean", "wine", "surf"]),
    },
  });

  await prisma.tripEvent.createMany({ data: [
    {
      tripId: portugal.id, title: "Flight TP1235: London → Lisbon",
      type: "FLIGHT", view: "LOGISTICS",
      startsAt: new Date("2026-04-14T10:15:00Z"), endsAt: new Date("2026-04-14T13:20:00Z"),
      timezone: "Europe/London", locationName: "Heathrow Airport (LHR)",
      details: JSON.stringify({ flightNumber: "TP1235", airline: "TAP Portugal", bookingRef: "TAPXYZ", seat: "22A" }),
      sourceType: "email", confidence: 0.98,
    },
    {
      tripId: portugal.id, title: "Bairro Alto Hotel — Check-in",
      type: "HOTEL", view: "LOGISTICS",
      startsAt: new Date("2026-04-14T15:00:00Z"), endsAt: new Date("2026-04-18T11:00:00Z"),
      timezone: "Europe/Lisbon", locationName: "Bairro Alto Hotel, Praça Luís de Camões",
      locationLat: 38.7130, locationLng: -9.1428,
      details: JSON.stringify({ confirmationNumber: "BAH-2026-331", nights: 4, roomType: "Classic" }),
      sourceType: "pdf", confidence: 0.95,
    },
    {
      tripId: portugal.id, title: "Time Out Market Lisboa",
      type: "FOOD", view: "MOMENTS",
      startsAt: new Date("2026-04-15T13:00:00Z"), endsAt: new Date("2026-04-15T15:00:00Z"),
      timezone: "Europe/Lisbon", locationName: "Time Out Market Lisboa",
      locationLat: 38.7066, locationLng: -9.1457,
      details: JSON.stringify({ notes: "Bacalhau à Brás at Chef Kiko + pastel de nata" }),
      sourceType: "manual", confidence: 1.0, emoji: "🥚",
    },
    {
      tripId: portugal.id, title: "Sintra day trip — Pena Palace",
      type: "ACTIVITY", view: "BOTH",
      startsAt: new Date("2026-04-16T09:00:00Z"), endsAt: new Date("2026-04-16T18:00:00Z"),
      timezone: "Europe/Lisbon", locationName: "Palácio Nacional da Pena, Sintra",
      locationLat: 38.7877, locationLng: -9.3906,
      details: JSON.stringify({ ticketRef: "PENA-20260416", admission: 14 }),
      sourceType: "manual", confidence: 1.0,
    },
    {
      tripId: portugal.id, title: "Surf lesson — Cascais",
      type: "ACTIVITY", view: "MOMENTS",
      startsAt: new Date("2026-04-17T10:00:00Z"), endsAt: new Date("2026-04-17T12:30:00Z"),
      timezone: "Europe/Lisbon", locationName: "Praia de Guincho, Cascais",
      locationLat: 38.7258, locationLng: -9.4741,
      details: JSON.stringify({ school: "Cascais Surf School", instructor: "Pedro", admission: 65 }),
      sourceType: "manual", confidence: 1.0, emoji: "🏄",
    },
    {
      tripId: portugal.id, title: "Car rental pickup — Hertz Lisbon",
      type: "OTHER", view: "LOGISTICS",
      startsAt: new Date("2026-04-18T10:00:00Z"),
      timezone: "Europe/Lisbon", locationName: "Hertz Lisbon Airport",
      details: JSON.stringify({ bookingRef: "HERTZ-20260418", car: "VW Golf", days: 7 }),
      sourceType: "email", confidence: 0.91,
    },
    {
      tripId: portugal.id, title: "Douro Valley wine tasting — Quinta da Gaivosa",
      type: "ACTIVITY", view: "BOTH",
      startsAt: new Date("2026-04-22T11:00:00Z"), endsAt: new Date("2026-04-22T14:00:00Z"),
      timezone: "Europe/Lisbon", locationName: "Quinta da Gaivosa, Douro Valley",
      locationLat: 41.1760, locationLng: -7.7600,
      details: JSON.stringify({ bookingRef: "GAIV-2026-88", admission: 35, includes: ["3 wines", "charcuterie board"] }),
      sourceType: "email", confidence: 0.93, emoji: "🍷",
    },
    {
      tripId: portugal.id, title: "Torel Palace Porto — Check-in",
      type: "HOTEL", view: "LOGISTICS",
      startsAt: new Date("2026-04-22T15:00:00Z"), endsAt: new Date("2026-04-25T11:00:00Z"),
      timezone: "Europe/Lisbon", locationName: "Torel Palace, Rua de Entremuros, Porto",
      locationLat: 41.1450, locationLng: -8.6100,
      details: JSON.stringify({ confirmationNumber: "TOREL-2026-441", nights: 3, roomType: "Superior River View", breakfast: true }),
      sourceType: "pdf", confidence: 0.97,
    },
  ]});

  await prisma.expense.createMany({ data: [
    { userId: user.id, tripId: portugal.id, title: "TAP flight London→Lisbon", amount: 187, currency: "EUR", category: "TRANSPORT", date: new Date("2026-04-14"), isPaid: true },
    { userId: user.id, tripId: portugal.id, title: "Bairro Alto Hotel — 4 nights", amount: 540, currency: "EUR", category: "ACCOMMODATION", date: new Date("2026-04-14"), isPaid: true },
    { userId: user.id, tripId: portugal.id, title: "Time Out Market dinner", amount: 38, currency: "EUR", category: "FOOD", date: new Date("2026-04-15"), isPaid: true },
    { userId: user.id, tripId: portugal.id, title: "Sintra day trip + tickets", amount: 42, currency: "EUR", category: "ACTIVITIES", date: new Date("2026-04-16"), isPaid: true },
    { userId: user.id, tripId: portugal.id, title: "Surf lesson Cascais", amount: 65, currency: "EUR", category: "ACTIVITIES", date: new Date("2026-04-17"), isPaid: true },
    { userId: user.id, tripId: portugal.id, title: "Car rental (7 days)", amount: 245, currency: "EUR", category: "TRANSPORT", date: new Date("2026-04-18"), isPaid: true },
  ]});

  await prisma.journalEntry.createMany({ data: [
    {
      userId: user.id, tripId: portugal.id,
      title: "Giorno 1 — Lisbona mi ha rubato il cuore",
      content: "Sono atterrato sotto un cielo pieno di nuvole rosa e oro. Lisbona è tutto quello che mi aspettavo — tram gialli su salite impossibili, azulejos blu ovunque, il profumo di pesce grigliato che esce da ogni vicolo. Ho camminato per 6 ore senza meta e mi sono sentito completamente a casa.",
      mood: "🌊", entryDate: new Date("2026-04-14"),
    },
    {
      userId: user.id, tripId: portugal.id,
      title: "Giorno 3 — Sintra è un sogno",
      content: "Il palazzo Pena è surreale — giallo e rosso e arancione che spuntano dalla nebbia. Ci siamo svegliati alle 6 per evitare le folle e abbiamo avuto i giardini quasi tutti per noi. Nel pomeriggio ho mangiato le migliori travesseiros della mia vita in una pasticceria nascosta nel borgo.",
      mood: "🏰", entryDate: new Date("2026-04-16"),
    },
  ]});

  await prisma.document.createMany({ data: [
    {
      userId: user.id, tripId: portugal.id, filename: "TAP_TP1235_booking.pdf",
      mimeType: "application/pdf", fileSize: 128400,
      storageKey: "demo/TAP_TP1235_booking.pdf", type: "FLIGHT_TICKET",
      status: "EXTRACTED", source: "EMAIL_FORWARD",
      extractedData: JSON.stringify({ flightNumber: "TP1235", airline: "TAP Portugal", bookingRef: "TAPXYZ", departureDate: "2026-04-14", seat: "22A" }),
      extractionModel: "claude-sonnet-4-6", extractionConfidence: 0.98,
      tags: JSON.stringify(["flight", "tap"]),
    },
    {
      userId: user.id, tripId: portugal.id, filename: "hertz_car_rental.pdf",
      mimeType: "application/pdf", fileSize: 87200,
      storageKey: "demo/hertz_car_rental.pdf", type: "OTHER",
      status: "EXTRACTED", source: "EMAIL_FORWARD",
      extractedData: JSON.stringify({ company: "Hertz", bookingRef: "HERTZ-20260418", car: "VW Golf", pickupDate: "2026-04-18", returnDate: "2026-04-25" }),
      extractionModel: "claude-sonnet-4-6", extractionConfidence: 0.91,
      tags: JSON.stringify(["car-rental", "hertz"]),
    },
    {
      userId: user.id, tripId: portugal.id, filename: "torel_palace_porto.pdf",
      mimeType: "application/pdf", fileSize: 104600,
      storageKey: "demo/torel_palace_porto.pdf", type: "HOTEL_VOUCHER",
      status: "EXTRACTED", source: "PDF_UPLOAD",
      extractedData: JSON.stringify({ hotel: "Torel Palace Porto", confirmationNumber: "TOREL-2026-441", checkIn: "2026-04-22", checkOut: "2026-04-25", nights: 3 }),
      extractionModel: "claude-sonnet-4-6", extractionConfidence: 0.97,
      tags: JSON.stringify(["hotel", "porto"]),
    },
    {
      userId: user.id, tripId: portugal.id, filename: "douro_wine_tour.pdf",
      mimeType: "application/pdf", fileSize: 42800,
      storageKey: "demo/douro_wine_tour.pdf", type: "BOOKING_CONFIRMATION",
      status: "EXTRACTED", source: "EMAIL_FORWARD",
      extractedData: JSON.stringify({ operator: "Quinta da Gaivosa", bookingRef: "GAIV-2026-88", date: "2026-04-22", admission: 35 }),
      extractionModel: "claude-sonnet-4-6", extractionConfidence: 0.93,
      tags: JSON.stringify(["activity", "wine"]),
    },
    {
      userId: user.id, tripId: portugal.id, filename: "travel_insurance.pdf",
      mimeType: "application/pdf", fileSize: 198300,
      storageKey: "demo/travel_insurance.pdf", type: "INSURANCE",
      status: "PENDING", source: "PDF_UPLOAD",
      tags: JSON.stringify(["insurance"]),
    },
  ]});

  await prisma.dailyBoard.createMany({ data: [
    {
      tripId: portugal.id, date: new Date("2026-04-21"),
      morningBriefing: "Day 8 on the road. Somewhere between Algarve and the Douro Valley. The N120 hugs the cliffs for the first hour heading north. Stop at Sagres for a coffee before you lose signal.",
      checklist: JSON.stringify([
        { id: "pt-1", text: "Check out of Lagos pousada by 10am", done: true, order: 1 },
        { id: "pt-2", text: "Fill up the rental car — last cheap station on the N125", done: true, order: 2 },
        { id: "pt-3", text: "Stop at Cabo de São Vicente (westernmost point of Europe!)", done: false, order: 3 },
        { id: "pt-4", text: "Book dinner in Porto for Thursday", done: false, order: 4 },
        { id: "pt-5", text: "Call home — you haven't in 3 days", done: false, order: 5 },
      ]),
      reminders: JSON.stringify([
        { id: "pt-r1", text: "Car rental return is April 25 at Lisbon Airport — don't miss it.", acknowledged: false },
      ]),
    },
    {
      tripId: portugal.id, date: new Date("2026-04-22"),
      morningBriefing: "Day 9 — the Douro Valley. Wine tasting at Quinta da Gaivosa at 11am, then check into Torel Palace Porto at 3pm. Tonight: Francesinha at Café Santiago, the dish Porto is actually famous for. Do not miss it.",
      checklist: JSON.stringify([
        { id: "pt22-1", text: "Drive to Douro Valley — leave by 9am", done: false, order: 1 },
        { id: "pt22-2", text: "Wine tasting at Quinta da Gaivosa (11:00)", done: false, order: 2 },
        { id: "pt22-3", text: "Check into Torel Palace Porto (from 15:00)", done: false, order: 3 },
        { id: "pt22-4", text: "Sunset at Miradouro da Serra do Pilar", done: false, order: 4 },
        { id: "pt22-5", text: "Francesinha dinner — Café Santiago", done: false, order: 5 },
      ]),
      reminders: JSON.stringify([
        { id: "pt22-r1", text: "Wine tour confirmation ref: GAIV-2026-88. Meet at the quinta gate at 10:50.", acknowledged: false },
        { id: "pt22-r2", text: "Car rental return: April 25 at Lisbon Airport. 3 days left.", acknowledged: false },
      ]),
    },
  ]});

  console.log(`✅ Portugal trip: 8 events, 5 docs, 6 expenses, 2 journal entries, 2 daily boards`);

  // ─── TRIP 4: Morocco Desert Adventure (PLANNING) ──────────────────────
  const morocco = await prisma.trip.create({
    data: {
      userId: user.id,
      title: "Morocco Desert Adventure",
      description: "10 days from Marrakech to the Sahara and back through the Atlas Mountains.",
      status: "PLANNING",
      startsAt: new Date("2026-10-10T00:00:00Z"),
      endsAt: new Date("2026-10-20T00:00:00Z"),
      timezone: "Africa/Casablanca",
      primaryDestination: "Marrakech, Morocco",
      destinations: JSON.stringify([
        { city: "Marrakech", country: "Morocco", lat: 31.6295, lng: -7.9811 },
        { city: "Merzouga", country: "Morocco", lat: 31.0988, lng: -4.0139 },
        { city: "Fes", country: "Morocco", lat: 34.0181, lng: -5.0078 },
      ]),
      tags: JSON.stringify(["africa", "desert", "adventure", "culture", "sahara"]),
    },
  });

  // ─── TRIP 5: NYC Long Weekend (COMPLETED) ─────────────────────────────
  const nyc = await prisma.trip.create({
    data: {
      userId: user.id,
      title: "New York Long Weekend",
      description: "4 days in Manhattan — art, food, and the best bagels in the world.",
      status: "COMPLETED",
      startsAt: new Date("2025-11-06T14:00:00Z"),
      endsAt: new Date("2025-11-10T21:00:00Z"),
      timezone: "America/New_York",
      primaryDestination: "New York, USA",
      destinations: JSON.stringify([{ city: "New York", country: "USA", lat: 40.7128, lng: -74.0060 }]),
      tags: JSON.stringify(["usa", "city", "art", "food", "weekend"]),
      memoryCapsule: JSON.stringify({
        summary: "4 incredible days in Manhattan — museums, jazz, and too much ramen.",
        highlights: ["MoMA entire afternoon", "Village Vanguard jazz late night", "Bagel at Russ & Daughters"],
        stats: { totalDays: 4, citiesVisited: 1, totalExpenses: 1240, currency: "USD", journalEntries: 2 },
        generatedAt: "2025-11-11T08:00:00Z",
      }),
    },
  });

  await prisma.expense.createMany({ data: [
    { userId: user.id, tripId: nyc.id, title: "BA flight London→JFK", amount: 420, currency: "USD", category: "TRANSPORT", date: new Date("2025-11-06"), isPaid: true },
    { userId: user.id, tripId: nyc.id, title: "The Standard High Line — 4 nights", amount: 580, currency: "USD", category: "ACCOMMODATION", date: new Date("2025-11-06"), isPaid: true },
    { userId: user.id, tripId: nyc.id, title: "MoMA admission", amount: 30, currency: "USD", category: "ACTIVITIES", date: new Date("2025-11-07"), isPaid: true },
    { userId: user.id, tripId: nyc.id, title: "Dinner at Lilia (pasta)", amount: 95, currency: "USD", category: "FOOD", date: new Date("2025-11-07"), isPaid: true },
    { userId: user.id, tripId: nyc.id, title: "Village Vanguard jazz", amount: 45, currency: "USD", category: "ACTIVITIES", date: new Date("2025-11-08"), isPaid: true },
    { userId: user.id, tripId: nyc.id, title: "Ramen at Ivan Ramen", amount: 28, currency: "USD", category: "FOOD", date: new Date("2025-11-09"), isPaid: true },
    { userId: user.id, tripId: nyc.id, title: "Shopping SoHo + MET store", amount: 220, currency: "USD", category: "SHOPPING", date: new Date("2025-11-09"), isPaid: true },
  ]});

  await prisma.journalEntry.createMany({ data: [
    {
      userId: user.id, tripId: nyc.id,
      title: "Giorno 2 — MoMA e la pioggia",
      content: "It rained all day. Best decision: spend 5 hours at MoMA instead of fighting puddles. Saw the Rothkos at the end of a long corridor and stood there for maybe 20 minutes. The guard looked at me like I was strange. I didn't care. At night walked to the High Line as the city lit up — the Empire State Building was purple.",
      mood: "🎨", entryDate: new Date("2025-11-07"),
    },
    {
      userId: user.id, tripId: nyc.id,
      title: "Giorno 3 — Jazz e ramen",
      content: "Village Vanguard at midnight — a quartet that played for 90 minutes without repeating a single mood. The bass player had been there since 1975. After, we walked to Ivan Ramen in the rain and ate alone at the counter. New York is best when it's not performing for you.",
      mood: "🎷", entryDate: new Date("2025-11-08"),
    },
  ]});

  console.log(`✅ NYC trip: 7 expenses, 2 journal entries`);
  console.log(`✅ Morocco trip: planning stage`);

  console.log("\n🎉 Seed complete!");
  console.log("   Login: demo@tripboard.app / demo1234");
  console.log("   Trips: Japan (upcoming), Amalfi (completed), Portugal (active), Morocco (planning), NYC (completed)");
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
