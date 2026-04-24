import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

interface ItineraryEvent {
  day: number;
  title: string;
  type: "ACTIVITY" | "HOTEL" | "FLIGHT" | "RESTAURANT" | "TRANSFER" | "OTHER";
  time?: string; // "HH:MM" 24h format, optional
  duration?: number; // minutes
  description?: string;
  locationName?: string;
  emoji?: string;
}

const SYSTEM_PROMPT = `You are a world-class travel planner AI for TripBoard.
Generate a realistic, day-by-day travel itinerary as a JSON array.
Each element must follow this exact schema:
{
  "day": <number starting at 1>,
  "title": "<concise activity name, max 60 chars>",
  "type": "ACTIVITY" | "HOTEL" | "FLIGHT" | "RESTAURANT" | "TRANSFER" | "OTHER",
  "time": "<HH:MM in 24h format, e.g. '09:00'>",
  "duration": <duration in minutes, integer>,
  "description": "<1 sentence description, max 100 chars>",
  "locationName": "<specific venue/place name if applicable>",
  "emoji": "<single relevant emoji>"
}

Rules:
- Return ONLY valid JSON array, no markdown, no extra text
- 3-5 events per day depending on trip length
- Include breakfast/lunch/dinner, main sights, and at least one unique local experience per day
- Keep activity times realistic (breakfast ~08:00, dinner ~19:30 etc.)
- Use specific venue/attraction names (real places)
- HOTEL type = check-in/check-out, use for first and last day
- Mix ACTIVITY, RESTAURANT, TRANSFER types realistically
`;

export async function POST(
  _req: Request,
  { params }: { params: { tripId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;

  const trip = await prisma.trip.findFirst({
    where: { id: params.tripId, userId, deletedAt: null },
    select: { id: true, title: true, primaryDestination: true, destinations: true, startsAt: true, endsAt: true },
  });
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "your-anthropic-api-key-here") {
    return NextResponse.json({ error: "AI not configured" }, { status: 503 });
  }

  // Calculate trip length
  const startsAt = trip.startsAt ?? new Date();
  const endsAt = trip.endsAt ?? new Date(startsAt.getTime() + 7 * 86400000);
  const totalDays = Math.max(1, Math.round((endsAt.getTime() - startsAt.getTime()) / 86400000));
  const cappedDays = Math.min(totalDays, 14); // cap at 2 weeks to control output size

  const destinations = (() => {
    try {
      const parsed = JSON.parse((trip.destinations as unknown as string) || "[]") as Array<{ city: string; country: string }>;
      return parsed.map((d) => d.city).join(", ");
    } catch { return ""; }
  })();

  const destDisplay = destinations || trip.primaryDestination || "the destination";

  const prompt = `Create a ${cappedDays}-day itinerary for a trip to ${destDisplay}.
Trip name: "${trip.title}"
Duration: ${cappedDays} days (day 1 through day ${cappedDays})

Respond with a JSON array only. No markdown, no comments.`;

  let events: ItineraryEvent[] = [];

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
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[ai-itinerary] Anthropic error:", err);
      return NextResponse.json({ error: "AI request failed" }, { status: 502 });
    }

    const data = (await response.json()) as {
      content?: Array<{ type: string; text: string }>;
    };

    const raw = data.content?.find((b) => b.type === "text")?.text?.trim() ?? "";

    // Strip markdown code fences if present
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
    events = JSON.parse(cleaned) as ItineraryEvent[];

    if (!Array.isArray(events)) {
      return NextResponse.json({ error: "Invalid AI response format" }, { status: 502 });
    }
  } catch (err) {
    console.error("[ai-itinerary] parse error:", err);
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 502 });
  }

  // Clear existing AI-generated events (sourceType = 'AI_ITINERARY') before re-generating
  await prisma.tripEvent.deleteMany({
    where: { tripId: params.tripId, sourceType: "AI_ITINERARY" },
  });

  // Create events in DB
  const created = await prisma.$transaction(
    events.map((ev) => {
      const dayOffset = Math.max(0, (ev.day ?? 1) - 1);
      const baseDate = new Date(startsAt);
      baseDate.setDate(baseDate.getDate() + dayOffset);

      // Apply time if provided
      let eventStart: Date = baseDate;
      if (ev.time) {
        const [hh, mm] = ev.time.split(":").map(Number);
        eventStart = new Date(baseDate);
        eventStart.setHours(hh ?? 9, mm ?? 0, 0, 0);
      }

      let eventEnd: Date | undefined;
      if (ev.duration) {
        eventEnd = new Date(eventStart.getTime() + ev.duration * 60000);
      }

      return prisma.tripEvent.create({
        data: {
          tripId: params.tripId,
          title: (ev.title ?? "").slice(0, 120),
          type: (ev.type ?? "ACTIVITY").toUpperCase(),
          view: "LOGISTICS",
          startsAt: eventStart,
          endsAt: eventEnd ?? null,
          locationName: ev.locationName ?? null,
          notes: ev.description ?? null,
          emoji: ev.emoji ?? null,
          sourceType: "AI_ITINERARY",
          details: "{}",
        },
      });
    })
  );

  return NextResponse.json({ data: { count: created.length } });
}
