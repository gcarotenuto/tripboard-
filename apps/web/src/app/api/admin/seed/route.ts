import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  // Clean existing data for this user
  await prisma.trip.deleteMany({ where: { userId } });

  // ─── TRIP 1: Tokyo Active ───────────────────────────────────
  const tokyo = await prisma.trip.create({
    data: {
      userId,
      title: "Japan Spring 2026",
      description: "Two weeks in Japan during cherry blossom season. Tokyo, Kyoto, Osaka.",
      status: "ACTIVE",
      primaryDestination: "Tokyo, Japan",
      destinations: JSON.stringify(["Tokyo", "Kyoto", "Osaka", "Nara"]),
      tags: JSON.stringify(["culture", "food", "nature"]),
      startsAt: new Date("2026-04-10"),
      endsAt: new Date("2026-04-25"),
      timezone: "Asia/Tokyo",
    },
  });

  await prisma.tripEvent.createMany({
    data: [
      {
        tripId: tokyo.id,
        title: "Flight FCO → NRT",
        type: "FLIGHT",
        view: "LOGISTICS",
        startsAt: new Date("2026-04-10T08:30:00Z"),
        endsAt: new Date("2026-04-11T06:00:00Z"),
        locationName: "Fiumicino Airport",
        details: JSON.stringify({ flightNumber: "AZ786", airline: "Alitalia", seat: "14A", terminal: "T3" }),
        confidence: 0.97,
      },
      {
        tripId: tokyo.id,
        title: "Check-in: Hotel Gracery Shinjuku",
        type: "ACCOMMODATION",
        view: "LOGISTICS",
        startsAt: new Date("2026-04-11T15:00:00Z"),
        endsAt: new Date("2026-04-16T11:00:00Z"),
        locationName: "Hotel Gracery Shinjuku",
        locationAddress: "1-19-1 Kabukicho, Shinjuku-ku, Tokyo",
        details: JSON.stringify({ confirmationCode: "HTG-4821", roomType: "Superior Twin", nights: 5 }),
        confidence: 0.95,
      },
      {
        tripId: tokyo.id,
        title: "Tsukiji Fish Market breakfast",
        type: "ACTIVITY",
        view: "MOMENTS",
        startsAt: new Date("2026-04-12T06:00:00Z"),
        endsAt: new Date("2026-04-12T09:00:00Z"),
        locationName: "Tsukiji Outer Market",
        locationAddress: "4-16-2 Tsukiji, Chuo-ku, Tokyo",
        details: JSON.stringify({ category: "Food & Drink", notes: "Best tuna sashimi I've ever had" }),
        confidence: 0.88,
      },
      {
        tripId: tokyo.id,
        title: "Shinkansen Tokyo → Kyoto",
        type: "TRAIN",
        view: "LOGISTICS",
        startsAt: new Date("2026-04-16T09:33:00Z"),
        endsAt: new Date("2026-04-16T12:15:00Z"),
        locationName: "Tokyo Station",
        details: JSON.stringify({ trainNumber: "Nozomi 17", car: "7", seat: "12C", class: "Reserved" }),
        confidence: 0.99,
      },
      {
        tripId: tokyo.id,
        title: "Fushimi Inari-taisha",
        type: "ACTIVITY",
        view: "MOMENTS",
        startsAt: new Date("2026-04-17T07:30:00Z"),
        endsAt: new Date("2026-04-17T11:00:00Z"),
        locationName: "Fushimi Inari Taisha",
        locationAddress: "68 Fukakusa Yabunouchicho, Fushimi-ku, Kyoto",
        details: JSON.stringify({ category: "Sightseeing", notes: "Go early to avoid crowds" }),
        confidence: 0.91,
      },
      {
        tripId: tokyo.id,
        title: "Check-in: The Mitsui Kyoto",
        type: "ACCOMMODATION",
        view: "LOGISTICS",
        startsAt: new Date("2026-04-16T15:00:00Z"),
        endsAt: new Date("2026-04-20T11:00:00Z"),
        locationName: "The Mitsui Kyoto",
        details: JSON.stringify({ confirmationCode: "MTK-9934", nights: 4, roomType: "Deluxe Garden" }),
        confidence: 0.96,
      },
      {
        tripId: tokyo.id,
        title: "Arashiyama Bamboo Grove",
        type: "ACTIVITY",
        view: "MOMENTS",
        startsAt: new Date("2026-04-18T08:00:00Z"),
        endsAt: new Date("2026-04-18T12:00:00Z"),
        locationName: "Arashiyama Bamboo Grove",
        details: JSON.stringify({ category: "Nature", notes: "Magical at sunrise" }),
        confidence: 0.89,
      },
      {
        tripId: tokyo.id,
        title: "Flight NRT → FCO",
        type: "FLIGHT",
        view: "LOGISTICS",
        startsAt: new Date("2026-04-25T14:00:00Z"),
        endsAt: new Date("2026-04-25T20:30:00Z"),
        locationName: "Narita International Airport",
        details: JSON.stringify({ flightNumber: "AZ787", airline: "Alitalia", seat: "14A" }),
        confidence: 0.97,
      },
    ],
  });

  await prisma.expense.createMany({
    data: [
      { userId, tripId: tokyo.id, title: "Voli A/R", amount: 1240, currency: "EUR", category: "TRANSPORT", date: new Date("2026-03-01"), isPaid: true },
      { userId, tripId: tokyo.id, title: "Hotel Gracery Shinjuku (5 notti)", amount: 890, currency: "EUR", category: "ACCOMMODATION", date: new Date("2026-04-11"), isPaid: true },
      { userId, tripId: tokyo.id, title: "The Mitsui Kyoto (4 notti)", amount: 1420, currency: "EUR", category: "ACCOMMODATION", date: new Date("2026-04-16"), isPaid: true },
      { userId, tripId: tokyo.id, title: "Shinkansen Pass 7 giorni", amount: 310, currency: "EUR", category: "TRANSPORT", date: new Date("2026-04-11"), isPaid: true },
      { userId, tripId: tokyo.id, title: "Cena Sukiyabashi Jiro", amount: 280, currency: "JPY", amountUsd: 185, category: "FOOD", date: new Date("2026-04-13"), isPaid: true },
      { userId, tripId: tokyo.id, title: "Shopping Akihabara", amount: 45000, currency: "JPY", amountUsd: 290, category: "SHOPPING", date: new Date("2026-04-14"), isPaid: true },
    ],
  });

  await prisma.journalEntry.createMany({
    data: [
      {
        userId, tripId: tokyo.id,
        title: "Primo giorno a Tokyo — overwhelm nel senso migliore",
        content: "L'aereo è atterrato stamattina presto e Tokyo mi ha già stordito. Shinjuku di sera è una cosa che non si può descrivere a parole — luci al neon ovunque, odore di ramen, gente che cammina in silenzio eppure tutto è frenetico. Ho mangiato un tonkatsu da un distributore automatico alle 2 di notte e sono ancora in piedi.",
        mood: "excited",
        locationName: "Shinjuku, Tokyo",
        entryDate: new Date("2026-04-11"),
      },
      {
        userId, tripId: tokyo.id,
        title: "Tsukiji e il pesce più buono della mia vita",
        content: "Sveglia alle 5:30. Il mercato di Tsukiji Outer Market è già in piena attività — bancarelle di tonno, salmone, ricci di mare. Ho mangiato nigiri alle 7 di mattina e ho capito cosa vuol dire il sushi vero. Poi Senso-ji con la nebbia — quasi nessun turista a quell'ora.",
        mood: "happy",
        locationName: "Tsukiji, Tokyo",
        entryDate: new Date("2026-04-12"),
      },
      {
        userId, tripId: tokyo.id,
        title: "Kyoto — il Giappone che sognavo",
        content: "Fushimi Inari all'alba. Ho percorso il sentiero dei torii per due ore, quasi da solo. Il silenzio dei boschi interrotto solo dal vento e da qualche corvo. Kyoto è un'altra cosa rispetto a Tokyo — lenta, silenziosa, densa di storia.",
        mood: "peaceful",
        locationName: "Fushimi Inari, Kyoto",
        entryDate: new Date("2026-04-17"),
      },
    ],
  });

  // ─── TRIP 2: Marocco Upcoming ─────────────────────────────────
  const morocco = await prisma.trip.create({
    data: {
      userId,
      title: "Marocco — Deserto e Medine",
      description: "Marrakech, Sahara, Chefchaouen. Un viaggio tra spezie e dune.",
      status: "UPCOMING",
      primaryDestination: "Marrakech, Morocco",
      destinations: JSON.stringify(["Marrakech", "Merzouga", "Fes", "Chefchaouen"]),
      tags: JSON.stringify(["adventure", "culture", "desert"]),
      startsAt: new Date("2026-07-12"),
      endsAt: new Date("2026-07-26"),
      timezone: "Africa/Casablanca",
    },
  });

  await prisma.tripEvent.createMany({
    data: [
      {
        tripId: morocco.id,
        title: "Volo NAP → RAK",
        type: "FLIGHT",
        view: "LOGISTICS",
        startsAt: new Date("2026-07-12T06:15:00Z"),
        endsAt: new Date("2026-07-12T08:45:00Z"),
        locationName: "Aeroporto di Napoli",
        details: JSON.stringify({ flightNumber: "FR2841", airline: "Ryanair", seat: "22B" }),
        confidence: 0.98,
      },
      {
        tripId: morocco.id,
        title: "Riad Yasmine Marrakech",
        type: "ACCOMMODATION",
        view: "LOGISTICS",
        startsAt: new Date("2026-07-12T15:00:00Z"),
        endsAt: new Date("2026-07-16T11:00:00Z"),
        locationName: "Riad Yasmine",
        locationAddress: "Derb Sidi Ahmed Ou Moussa, Marrakech Medina",
        details: JSON.stringify({ confirmationCode: "RY-2287", nights: 4, roomType: "Suite Jasmine" }),
        confidence: 0.94,
      },
      {
        tripId: morocco.id,
        title: "Tour Sahara — Merzouga",
        type: "ACTIVITY",
        view: "MOMENTS",
        startsAt: new Date("2026-07-18T05:00:00Z"),
        endsAt: new Date("2026-07-19T20:00:00Z"),
        locationName: "Erg Chebbi, Merzouga",
        details: JSON.stringify({ category: "Adventure", notes: "Cammello + notte sotto le stelle in tenda berbera" }),
        confidence: 0.87,
      },
    ],
  });

  await prisma.expense.createMany({
    data: [
      { userId, tripId: morocco.id, title: "Voli A/R Ryanair", amount: 180, currency: "EUR", category: "TRANSPORT", date: new Date("2026-05-10"), isPaid: true },
      { userId, tripId: morocco.id, title: "Riad Yasmine (4 notti)", amount: 520, currency: "EUR", category: "ACCOMMODATION", date: new Date("2026-07-12"), isPaid: false },
      { userId, tripId: morocco.id, title: "Tour Sahara 2 giorni", amount: 280, currency: "EUR", category: "ACTIVITY", date: new Date("2026-07-18"), isPaid: false },
    ],
  });

  // ─── TRIP 3: New York Completed ────────────────────────────────
  const nyc = await prisma.trip.create({
    data: {
      userId,
      title: "New York City — Gennaio 2026",
      description: "5 giorni a NYC per lavoro e tempo libero.",
      status: "COMPLETED",
      primaryDestination: "New York, USA",
      destinations: JSON.stringify(["Manhattan", "Brooklyn"]),
      tags: JSON.stringify(["business", "city"]),
      startsAt: new Date("2026-01-15"),
      endsAt: new Date("2026-01-20"),
      timezone: "America/New_York",
    },
  });

  await prisma.tripEvent.createMany({
    data: [
      {
        tripId: nyc.id,
        title: "Volo FCO → JFK",
        type: "FLIGHT",
        view: "LOGISTICS",
        startsAt: new Date("2026-01-15T10:20:00Z"),
        endsAt: new Date("2026-01-15T14:35:00Z"),
        locationName: "Fiumicino Airport",
        details: JSON.stringify({ flightNumber: "AZ609", airline: "Alitalia", seat: "8C" }),
        confidence: 0.99,
      },
      {
        tripId: nyc.id,
        title: "The Standard High Line",
        type: "ACCOMMODATION",
        view: "LOGISTICS",
        startsAt: new Date("2026-01-15T16:00:00Z"),
        endsAt: new Date("2026-01-20T12:00:00Z"),
        locationName: "The Standard High Line",
        locationAddress: "848 Washington St, New York, NY 10014",
        details: JSON.stringify({ confirmationCode: "STD-6612", nights: 5, roomType: "High Line King" }),
        confidence: 0.97,
      },
      {
        tripId: nyc.id,
        title: "Cena da Carbone",
        type: "RESTAURANT",
        view: "MOMENTS",
        startsAt: new Date("2026-01-17T20:00:00Z"),
        endsAt: new Date("2026-01-17T22:30:00Z"),
        locationName: "Carbone",
        locationAddress: "181 Thompson St, New York, NY 10012",
        details: JSON.stringify({ category: "Fine Dining", notes: "Rigatoni alla vodka indimenticabili" }),
        confidence: 0.91,
      },
      {
        tripId: nyc.id,
        title: "MoMA",
        type: "ACTIVITY",
        view: "MOMENTS",
        startsAt: new Date("2026-01-18T10:00:00Z"),
        endsAt: new Date("2026-01-18T14:00:00Z"),
        locationName: "Museum of Modern Art",
        locationAddress: "11 W 53rd St, New York, NY 10019",
        details: JSON.stringify({ category: "Museum", notes: "Mostra Basquiat straordinaria" }),
        confidence: 0.93,
      },
    ],
  });

  await prisma.expense.createMany({
    data: [
      { userId, tripId: nyc.id, title: "Voli A/R", amount: 890, currency: "EUR", category: "TRANSPORT", date: new Date("2026-01-15"), isPaid: true },
      { userId, tripId: nyc.id, title: "The Standard (5 notti)", amount: 1850, currency: "USD", amountUsd: 1850, category: "ACCOMMODATION", date: new Date("2026-01-15"), isPaid: true },
      { userId, tripId: nyc.id, title: "Cena Carbone", amount: 310, currency: "USD", amountUsd: 310, category: "FOOD", date: new Date("2026-01-17"), isPaid: true },
      { userId, tripId: nyc.id, title: "Taxi + Metro", amount: 95, currency: "USD", amountUsd: 95, category: "TRANSPORT", date: new Date("2026-01-19"), isPaid: true },
    ],
  });

  await prisma.journalEntry.createMany({
    data: [
      {
        userId, tripId: nyc.id,
        title: "Manhattan in gennaio — freddo e meraviglioso",
        content: "New York in inverno ha una luce che non trovi da nessuna parte. Il freddo punge ma la città è più vera, meno turistica. Ho camminato sulla High Line con la neve e poi sono sceso al Chelsea Market. Ho compreso perché questa città rende dipendenti.",
        mood: "inspired",
        locationName: "High Line, Manhattan",
        entryDate: new Date("2026-01-16"),
      },
    ],
  });

  return NextResponse.json({
    data: {
      trips: 3,
      events: 16,
      expenses: 13,
      journals: 4,
      message: "Database seeded successfully!",
    },
  });
}
