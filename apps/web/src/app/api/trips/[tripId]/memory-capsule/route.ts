import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are a travel memory writer for TripBoard.
Given data about a completed trip, generate a Memory Capsule as a JSON object.

Required schema:
{
  "summary": "<2-3 vivid, personal sentences capturing the essence of the trip. Write in second person ('You explored...', 'Your days in...'). Max 200 chars.>",
  "highlights": ["<specific memorable moment or place>", "<another highlight>", ...],
  "stats": {
    "totalDays": <number or null>,
    "citiesVisited": <number or null>,
    "totalExpenses": <number rounded to 2 decimals or null>,
    "currency": "<ISO currency code or null>",
    "journalEntries": <number or null>
  }
}

Rules:
- Return ONLY valid JSON, no markdown, no extra text
- highlights: 3-5 items, each max 80 chars, specific and evocative (real place names if available)
- If no journal entries or expenses are provided, still write a beautiful summary based on destination and dates
- stats fields are null if data is unavailable
- Keep the tone warm, personal, and travel-magazine-esque
`;

export async function POST(
  _req: Request,
  { params }: { params: { tripId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;

  // Fetch the trip with related data for context
  const trip = await prisma.trip.findFirst({
    where: { id: params.tripId, userId, deletedAt: null },
    select: {
      id: true,
      title: true,
      primaryDestination: true,
      destinations: true,
      startsAt: true,
      endsAt: true,
      description: true,
      status: true,
    },
  });
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "your-anthropic-api-key-here") {
    return NextResponse.json({ error: "AI not configured" }, { status: 503 });
  }

  // Gather context data
  const [journalEntries, expenses, events] = await Promise.all([
    prisma.journalEntry.findMany({
      where: { tripId: params.tripId, deletedAt: null },
      select: { title: true, content: true, mood: true, entryDate: true },
      orderBy: { entryDate: "asc" },
    }),
    prisma.expense.findMany({
      where: { tripId: params.tripId },
      select: { amount: true, currency: true, category: true, title: true },
    }),
    prisma.tripEvent.findMany({
      where: { tripId: params.tripId },
      select: { title: true, type: true, locationName: true },
      orderBy: { startsAt: "asc" },
      take: 30,
    }),
  ]);

  // Parse destinations
  const destinations = (() => {
    try {
      const parsed = JSON.parse((trip.destinations as unknown as string) || "[]") as Array<{ city: string; country: string }>;
      return parsed.map((d) => `${d.city}, ${d.country}`).join(" · ");
    } catch { return ""; }
  })();

  const destDisplay = destinations || trip.primaryDestination || "the destination";

  // Calculate duration
  const durationDays =
    trip.startsAt && trip.endsAt
      ? Math.max(1, Math.round((new Date(trip.endsAt).getTime() - new Date(trip.startsAt).getTime()) / 86400000))
      : null;

  // Compute expense total (dominant currency)
  const expenseSummary = (() => {
    if (!expenses.length) return null;
    const byCurrency: Record<string, number> = {};
    for (const e of expenses) {
      byCurrency[e.currency] = (byCurrency[e.currency] ?? 0) + e.amount;
    }
    const dominant = Object.entries(byCurrency).sort((a, b) => b[1] - a[1])[0];
    return dominant ? { amount: Math.round(dominant[1] * 100) / 100, currency: dominant[0] } : null;
  })();

  // Unique locations from events
  const locations = [...new Set(events.map((e) => e.locationName).filter(Boolean))].slice(0, 10);

  // Journal excerpts (first sentence of each entry)
  const journalExcerpts = journalEntries
    .map((e) => {
      const firstLine = (e.content ?? "").split(/[.\n]/)[0]?.trim();
      return firstLine ? `[${e.mood ?? ""}] "${firstLine}"` : null;
    })
    .filter(Boolean)
    .slice(0, 5);

  const prompt = `Generate a Memory Capsule for this completed trip:

Trip: "${trip.title}"
Destination: ${destDisplay}
Duration: ${durationDays ? `${durationDays} days` : "unknown"}
${trip.startsAt ? `Dates: ${new Date(trip.startsAt).toDateString()} to ${trip.endsAt ? new Date(trip.endsAt).toDateString() : "?"}` : ""}
${trip.description ? `Description: ${trip.description}` : ""}

Events & Places visited (${events.length} total):
${locations.length ? locations.join(", ") : "No specific locations recorded"}

Journal entries (${journalEntries.length} total):
${journalExcerpts.length ? journalExcerpts.join("\n") : "No journal entries"}

Expenses: ${expenseSummary ? `${expenseSummary.amount} ${expenseSummary.currency} total across ${expenses.length} transactions` : "No expenses recorded"}

Return ONLY the JSON object. No markdown.`;

  let capsule: unknown;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL ?? "claude-haiku-4-5",
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[memory-capsule] Anthropic error:", err);
      return NextResponse.json({ error: "AI request failed" }, { status: 502 });
    }

    const data = (await response.json()) as {
      content?: Array<{ type: string; text: string }>;
    };

    const raw = data.content?.find((b) => b.type === "text")?.text?.trim() ?? "";
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
    capsule = JSON.parse(cleaned);
  } catch (err) {
    console.error("[memory-capsule] parse error:", err);
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 502 });
  }

  // Enrich stats with real data
  const capsuleWithStats = {
    ...(capsule as Record<string, unknown>),
    stats: {
      ...((capsule as { stats?: Record<string, unknown> }).stats ?? {}),
      totalDays: durationDays,
      journalEntries: journalEntries.length,
      totalExpenses: expenseSummary?.amount ?? null,
      currency: expenseSummary?.currency ?? null,
    },
    generatedAt: new Date().toISOString(),
  };

  // Persist to the Trip record
  await prisma.trip.update({
    where: { id: params.tripId },
    data: { memoryCapsule: JSON.stringify(capsuleWithStats) },
  });

  return NextResponse.json({ data: capsuleWithStats });
}
