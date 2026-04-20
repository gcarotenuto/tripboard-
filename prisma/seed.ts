import { PrismaClient, TripStatus, EventType, EventView, DocumentType, DocumentStatus, DocumentSource, ExpenseCategory, ExpenseCurrency, IngestJobSource, IngestJobStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding TripBoard database...");

  // ── Demo User ─────────────────────────────────────────────
  const user = await prisma.user.upsert({
    where: { email: "demo@tripboard.app" },
    update: {},
    create: {
      email: "demo@tripboard.app",
      name: "Alex Traveler",
      emailVerified: new Date(),
      preferences: {
        theme: "dark",
        currency: "EUR",
        timezone: "Europe/Rome",
        language: "en",
        defaultView: "logistics",
      },
    },
  });
  console.log(`✅ User: ${user.email}`);

  // ── Trip 1: Active trip — Japan ───────────────────────────
  const japanTrip = await prisma.trip.create({
    data: {
      userId: user.id,
      title: "Japan Golden Week",
      description: "Two weeks exploring Tokyo, Kyoto, Osaka, and Hiroshima during cherry blossom season.",
      status: TripStatus.UPCOMING,
      startsAt: new Date("2026-04-25T08:00:00Z"),
      endsAt: new Date("2026-05-09T22:00:00Z"),
      timezone: "Asia/Tokyo",
      primaryDestination: "Tokyo, Japan",
      destinations: [
        { city: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503 },
        { city: "Kyoto", country: "Japan", lat: 35.0116, lng: 135.7681 },
        { city: "Osaka", country: "Japan", lat: 34.6937, lng: 135.5023 },
        { city: "Hiroshima", country: "Japan", lat: 34.3853, lng: 132.4553 },
      ],
      tags: ["asia", "culture", "food", "spring"],
    },
  });
  console.log(`✅ Trip: ${japanTrip.title}`);

  // ── Trip 2: Completed trip — Italy ────────────────────────
  const italyTrip = await prisma.trip.create({
    data: {
      userId: user.id,
      title: "Amalfi Coast & Rome",
      description: "10-day Italian adventure from Rome to Positano.",
      status: TripStatus.COMPLETED,
      startsAt: new Date("2025-09-05T06:00:00Z"),
      endsAt: new Date("2025-09-15T21:00:00Z"),
      timezone: "Europe/Rome",
      primaryDestination: "Rome, Italy",
      destinations: [
        { city: "Rome", country: "Italy", lat: 41.9028, lng: 12.4964 },
        { city: "Naples", country: "Italy", lat: 40.8518, lng: 14.2681 },
        { city: "Positano", country: "Italy", lat: 40.6281, lng: 14.4847 },
      ],
      tags: ["europe", "culture", "food", "coast"],
      memoryCapsule: {
        summary: "An unforgettable 10 days through ancient Rome and the stunning Amalfi Coast. Highlights included a private tour of the Colosseum, fresh seafood in Positano, and a lemon limoncello tasting in Ravello.",
        highlights: [
          "Private Colosseum tour at sunrise",
          "Boat trip to Capri",
          "Homemade pasta class in Naples",
          "Sunset at Villa Rufolo, Ravello",
        ],
        stats: {
          totalDays: 10,
          citiesVisited: 5,
          totalExpenses: 2840,
          currency: "EUR",
          photosCaptures: 847,
          journalEntries: 8,
        },
        generatedAt: "2025-09-16T10:00:00Z",
      },
    },
  });
  console.log(`✅ Trip: ${italyTrip.title}`);

  // ── Trip 3: Planning ─────────────────────────────────────
  const moroccoTrip = await prisma.trip.create({
    data: {
      userId: user.id,
      title: "Morocco Desert Adventure",
      status: TripStatus.PLANNING,
      startsAt: new Date("2026-10-10T00:00:00Z"),
      endsAt: new Date("2026-10-20T00:00:00Z"),
      timezone: "Africa/Casablanca",
      primaryDestination: "Marrakech, Morocco",
      destinations: [
        { city: "Marrakech", country: "Morocco", lat: 31.6295, lng: -7.9811 },
        { city: "Fes", country: "Morocco", lat: 34.0181, lng: -5.0078 },
        { city: "Merzouga", country: "Morocco", lat: 31.0998, lng: -4.0135 },
      ],
      tags: ["africa", "desert", "culture", "adventure"],
    },
  });
  console.log(`✅ Trip: ${moroccoTrip.title}`);

  // ── Events — Japan Trip ───────────────────────────────────
  const events = await Promise.all([
    prisma.tripEvent.create({
      data: {
        tripId: japanTrip.id,
        title: "Flight LH714: Frankfurt → Tokyo Haneda",
        type: EventType.FLIGHT,
        view: EventView.LOGISTICS,
        startsAt: new Date("2026-04-25T08:20:00Z"),
        endsAt: new Date("2026-04-26T06:45:00Z"),
        timezone: "Europe/Berlin",
        locationName: "Frankfurt Airport (FRA)",
        details: {
          flightNumber: "LH714",
          airline: "Lufthansa",
          departureAirport: "FRA",
          departureTerminal: "1",
          arrivalAirport: "HND",
          arrivalTerminal: "3",
          bookingRef: "LHXYZ123",
          seat: "14A",
          class: "Economy",
          duration: "13h25m",
        },
        sourceType: "email",
        confidence: 0.97,
      },
    }),
    prisma.tripEvent.create({
      data: {
        tripId: japanTrip.id,
        title: "Check in: Shinjuku Granbell Hotel",
        type: EventType.HOTEL,
        view: EventView.LOGISTICS,
        startsAt: new Date("2026-04-26T15:00:00Z"),
        endsAt: new Date("2026-05-02T11:00:00Z"),
        timezone: "Asia/Tokyo",
        locationName: "Shinjuku Granbell Hotel",
        locationAddress: "16-12 Kagacho, Shinjuku City, Tokyo",
        locationLat: 35.6938,
        locationLng: 139.7034,
        details: {
          confirmationNumber: "GRAN-2026-88821",
          checkIn: "2026-04-26",
          checkOut: "2026-05-02",
          nights: 6,
          roomType: "Deluxe King",
          breakfastIncluded: false,
          totalCost: 1240,
          currency: "EUR",
        },
        sourceType: "pdf",
        confidence: 0.94,
      },
    }),
    prisma.tripEvent.create({
      data: {
        tripId: japanTrip.id,
        title: "Shinkansen: Tokyo → Kyoto",
        type: EventType.TRAIN,
        view: EventView.LOGISTICS,
        startsAt: new Date("2026-05-02T09:33:00Z"),
        endsAt: new Date("2026-05-02T11:47:00Z"),
        timezone: "Asia/Tokyo",
        locationName: "Tokyo Station",
        details: {
          trainNumber: "Nozomi 7",
          operator: "JR Central",
          departureStation: "Tokyo",
          arrivalStation: "Kyoto",
          carriage: "5",
          seat: "12E",
          reservationNumber: "JR-29847162",
        },
        sourceType: "manual",
        confidence: 1.0,
      },
    }),
    prisma.tripEvent.create({
      data: {
        tripId: japanTrip.id,
        title: "Fushimi Inari Taisha",
        type: EventType.ACTIVITY,
        view: EventView.BOTH,
        startsAt: new Date("2026-05-03T06:00:00Z"),
        endsAt: new Date("2026-05-03T10:00:00Z"),
        timezone: "Asia/Tokyo",
        locationName: "Fushimi Inari Taisha",
        locationAddress: "68 Fukakusa Yabunouchicho, Fushimi Ward, Kyoto",
        locationLat: 34.9671,
        locationLng: 135.7727,
        details: { admission: "free", tips: "Go early morning to avoid crowds" },
        sourceType: "manual",
      },
    }),
  ]);
  console.log(`✅ Events: ${events.length} events created for Japan trip`);

  // ── Documents ─────────────────────────────────────────────
  const flightDoc = await prisma.document.create({
    data: {
      userId: user.id,
      tripId: japanTrip.id,
      filename: "LH714_booking_confirmation.pdf",
      mimeType: "application/pdf",
      fileSize: 142_880,
      storageKey: "demo/documents/LH714_booking_confirmation.pdf",
      type: DocumentType.BOOKING_CONFIRMATION,
      status: DocumentStatus.EXTRACTED,
      source: DocumentSource.PDF_UPLOAD,
      rawText: "Booking Confirmation\nFlight: LH714\nRoute: FRA → HND\nDeparture: 25 Apr 2026 08:20\nArrival: 26 Apr 2026 06:45\nPassenger: Alex Traveler\nBooking Reference: LHXYZ123\nSeat: 14A",
      extractedData: {
        flightNumber: "LH714",
        airline: "Lufthansa",
        departure: { airport: "FRA", datetime: "2026-04-25T08:20:00Z" },
        arrival: { airport: "HND", datetime: "2026-04-26T06:45:00Z" },
        passenger: "Alex Traveler",
        bookingRef: "LHXYZ123",
        seat: "14A",
      },
      extractionModel: "claude-sonnet-4-6",
      extractionConfidence: 0.97,
      tags: ["flight", "lufthansa"],
    },
  });

  await prisma.document.create({
    data: {
      userId: user.id,
      tripId: japanTrip.id,
      filename: "shinjuku_granbell_voucher.pdf",
      mimeType: "application/pdf",
      fileSize: 98_340,
      storageKey: "demo/documents/shinjuku_granbell_voucher.pdf",
      type: DocumentType.HOTEL_VOUCHER,
      status: DocumentStatus.EXTRACTED,
      source: DocumentSource.EMAIL_FORWARD,
      extractedData: {
        hotel: "Shinjuku Granbell Hotel",
        confirmationNumber: "GRAN-2026-88821",
        checkIn: "2026-04-26",
        checkOut: "2026-05-02",
        nights: 6,
        roomType: "Deluxe King",
      },
      extractionModel: "claude-sonnet-4-6",
      extractionConfidence: 0.94,
      tags: ["hotel", "tokyo", "shinjuku"],
    },
  });

  await prisma.document.create({
    data: {
      userId: user.id,
      tripId: japanTrip.id,
      filename: "japan_rail_pass_exchange_order.pdf",
      mimeType: "application/pdf",
      fileSize: 65_120,
      storageKey: "demo/documents/japan_rail_pass_exchange_order.pdf",
      type: DocumentType.TOUR_VOUCHER,
      status: DocumentStatus.PENDING,
      source: DocumentSource.PDF_UPLOAD,
      tags: ["rail-pass", "japan"],
    },
  });

  console.log(`✅ Documents: 3 documents created`);

  // ── Ingest Token ──────────────────────────────────────────
  await prisma.ingestToken.create({
    data: {
      userId: user.id,
      label: "Email Forward Token",
      source: "email_forward",
      tripId: japanTrip.id,
      isActive: true,
    },
  });
  console.log(`✅ Ingest token created`);

  // ── Expenses — Italy Trip ─────────────────────────────────
  const expenseData = [
    { title: "Colosseum tickets", amount: 52, category: ExpenseCategory.ACTIVITIES, date: "2025-09-06" },
    { title: "Hotel Roma — 3 nights", amount: 420, category: ExpenseCategory.ACCOMMODATION, date: "2025-09-05" },
    { title: "Dinner at Ristorante Il Sorpasso", amount: 78, category: ExpenseCategory.FOOD, date: "2025-09-07" },
    { title: "Train Roma → Naples", amount: 35, category: ExpenseCategory.TRANSPORT, date: "2025-09-09" },
    { title: "Limoncello tasting tour, Ravello", amount: 45, category: ExpenseCategory.ACTIVITIES, date: "2025-09-12" },
    { title: "Boat trip to Capri", amount: 120, category: ExpenseCategory.ACTIVITIES, date: "2025-09-13" },
    { title: "Le Sirenuse Hotel, Positano — 3 nights", amount: 1260, category: ExpenseCategory.ACCOMMODATION, date: "2025-09-11" },
    { title: "Pasta making class", amount: 95, category: ExpenseCategory.ACTIVITIES, date: "2025-09-10" },
    { title: "Taxi FCO airport", amount: 48, category: ExpenseCategory.TRANSPORT, date: "2025-09-05" },
    { title: "Souvenirs & shopping", amount: 215, category: ExpenseCategory.SHOPPING, date: "2025-09-14" },
  ];

  await Promise.all(
    expenseData.map((e) =>
      prisma.expense.create({
        data: {
          userId: user.id,
          tripId: italyTrip.id,
          title: e.title,
          amount: e.amount,
          currency: ExpenseCurrency.EUR,
          category: e.category,
          date: new Date(e.date),
          isPaid: true,
        },
      })
    )
  );
  console.log(`✅ Expenses: ${expenseData.length} expenses created for Italy trip`);

  // ── Journal Entries — Italy Trip ──────────────────────────
  const journalEntries = [
    {
      title: "Day 1 — Arrival in Rome",
      content: "## Day 1 — Arrival in Rome\n\nThe smell of espresso and old stone hits you the moment you step out of Termini. Found a tiny bar and had the best cornetto of my life standing at the counter like a local. Rome is loud, chaotic, and absolutely magnificent.\n\nThe Airbnb is in Trastevere — winding streets, laundry hanging between balconies, cats everywhere.",
      mood: "😍",
      entryDate: "2025-09-05",
    },
    {
      title: "Day 2 — Colosseum at dawn",
      content: "## Day 2 — Colosseum at dawn\n\nWoke up at 5:30 to be there for the early entry. Worth every second of lost sleep. The light was gold and the place was nearly empty. Standing in the center of the arena, I kept thinking about the 2,000 years of history compressed into this circle of stone.\n\nPizza al taglio for lunch from a place on Via della Croce. Simple perfection.",
      mood: "🏛️",
      entryDate: "2025-09-06",
    },
    {
      title: "Day 7 — Positano",
      content: "## Day 7 — Positano\n\nNothing prepares you for Positano. The town is almost vertical — steps everywhere, lemons the size of softballs, boats bobbing in a turquoise bay. Spent the afternoon on Spiaggia Grande doing absolutely nothing. It was the best afternoon of the year.\n\nDinner at a cliffside restaurant. Swordfish, white wine, stars over the Tyrrhenian Sea.",
      mood: "🍋",
      entryDate: "2025-09-11",
    },
  ];

  await Promise.all(
    journalEntries.map((j) =>
      prisma.journalEntry.create({
        data: {
          userId: user.id,
          tripId: italyTrip.id,
          title: j.title,
          content: j.content,
          mood: j.mood,
          entryDate: new Date(j.entryDate),
        },
      })
    )
  );
  console.log(`✅ Journal: ${journalEntries.length} entries created`);

  // ── Daily Board — Japan Trip ──────────────────────────────
  await prisma.dailyBoard.create({
    data: {
      tripId: japanTrip.id,
      date: new Date("2026-04-26"),
      morningBriefing: "Your flight LH714 lands at Haneda at 06:45. Immigration at Haneda is usually smooth with a valid e-Visa. Take the Keikyu Line or Airport Limousine Bus to Shinjuku. Hotel check-in is from 15:00 — you can store luggage early.",
      checklist: [
        { id: "1", text: "Exchange yen at airport (better rates than hotels)", done: false, order: 1 },
        { id: "2", text: "Pick up IC card (Suica/Pasmo) for transit", done: false, order: 2 },
        { id: "3", text: "Pocket WiFi pickup at Haneda arrivals", done: false, order: 3 },
        { id: "4", text: "Check in at Shinjuku Granbell (from 15:00)", done: false, order: 4 },
        { id: "5", text: "Explore Shinjuku Gyoen for jet lag recovery walk", done: false, order: 5 },
      ],
      reminders: [
        { id: "1", text: "Japan Rail Pass must be exchanged within 90 days of issue", time: null, acknowledged: false },
        { id: "2", text: "Shinkansen to Kyoto booked for 2 May — confirm seat", time: null, acknowledged: false },
      ],
    },
  });
  console.log(`✅ Daily Board: 1 day board created`);

  // ── Places — Japan ────────────────────────────────────────
  const places = [
    { placeId: "ChIJP3Sa8ziYEmsRUKgyFmh9AQM", name: "Fushimi Inari Taisha", city: "Kyoto", category: "attraction", lat: 34.9671, lng: 135.7727 },
    { placeId: "ChIJa3tHg4uLGGARdRJxABBfWhQ", name: "Tsukiji Outer Market", city: "Tokyo", category: "food_market", lat: 35.6654, lng: 139.7707 },
    { placeId: "ChIJeZiB3KGLGGARjPDCc2zE_jE", name: "Shinjuku Gyoen", city: "Tokyo", category: "park", lat: 35.6852, lng: 139.7100 },
    { placeId: "ChIJ4SyCHGCLGGARFfYBn3YYABY", name: "Meiji Jingu", city: "Tokyo", category: "shrine", lat: 35.6763, lng: 139.6993 },
  ];

  await Promise.all(
    places.map((p) =>
      prisma.tripPlace.create({
        data: {
          tripId: japanTrip.id,
          placeId: p.placeId,
          name: p.name,
          city: p.city,
          country: "Japan",
          lat: p.lat,
          lng: p.lng,
          category: p.category,
          visited: false,
          addedBy: "manual",
        },
      })
    )
  );
  console.log(`✅ Places: ${places.length} places added`);

  // ── Ingest Job ────────────────────────────────────────────
  await prisma.ingestJob.create({
    data: {
      userId: user.id,
      tripId: japanTrip.id,
      status: IngestJobStatus.COMPLETED,
      source: IngestJobSource.PDF_UPLOAD,
      startedAt: new Date("2026-04-10T14:30:00Z"),
      completedAt: new Date("2026-04-10T14:30:48Z"),
      documentsCreated: 2,
      eventsCreated: 2,
    },
  });
  console.log(`✅ Ingest job created`);

  console.log("\n🎉 Seed complete!");
  console.log(`   User: ${user.email}`);
  console.log(`   Trips: 3 (1 upcoming, 1 completed, 1 planning)`);
  console.log(`   Events: ${events.length}`);
  console.log(`   Documents: 3`);
  console.log(`   Expenses: ${expenseData.length}`);
  console.log(`   Journal entries: ${journalEntries.length}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
