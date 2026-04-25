import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are a personal travel concierge for TripBoard, writing a morning briefing for a traveler.
Generate a warm, energizing 2-3 sentence morning briefing for the traveler's day.

Guidelines:
- Write in second person ("Your day starts with...", "You have...")
- Be specific about events, times, and places when provided
- Mention any important documents or things to remember
- Keep it concise and motivating — like a friendly briefing from a knowledgeable concierge
- End with a positive note about the day ahead
- Max 3 sentences, max 180 words total
- Return ONLY the briefing text, no quotes, no markdown`;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const body = await req.json() as { tripId: string; date: string };
  const { tripId, date } = body;

  if (!tripId || !date) return NextResponse.json({ error: "Missing tripId or date" }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "your-anthropic-api-key-here") {
    return NextResponse.json({ error: "AI not configured" }, { status: 503 });
  }

  const trip = await prisma.trip.findFirst({ where: { id: tripId, userId } });
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const dateObj = new Date(date);
  const dayStart = new Date(dateObj);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(dateObj);
  dayEnd.setUTCHours(23, 59, 59, 999);

  const events = await prisma.tripEvent.findMany({
    where: { tripId, startsAt: { gte: dayStart, lte: dayEnd } },
    orderBy: { startsAt: "asc" },
    select: { title: true, type: true, startsAt: true, locationName: true },
  });

  const eventLines = events
    .map((e) => {
      const time = e.startsAt
        ? new Date(e.startsAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
        : "TBD";
      return `- ${time}: ${e.title}${e.locationName ? ` at ${e.locationName}` : ""}`;
    })
    .join("\n");

  const dateLabel = dateObj.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const prompt = `Generate a morning briefing for:
Trip: "${trip.title}"
Destination: ${trip.primaryDestination ?? "destination"}
Date: ${dateLabel}

Today's schedule (${events.length} events):
${eventLines || "No specific events scheduled — a free day to explore!"}

Write the briefing now:`;

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
        max_tokens: 220,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[daily/briefing] Anthropic error:", err);
      return NextResponse.json({ error: "AI request failed" }, { status: 502 });
    }

    const data = (await response.json()) as {
      content?: Array<{ type: string; text: string }>;
    };

    const briefing = data.content?.find((b) => b.type === "text")?.text?.trim() ?? "";

    if (!briefing) return NextResponse.json({ error: "Empty AI response" }, { status: 502 });

    // Persist to DailyBoard (upsert)
    const existingBoard = await prisma.dailyBoard.findFirst({
      where: { tripId, date: { gte: dayStart, lte: dayEnd } },
    });

    if (existingBoard) {
      await prisma.dailyBoard.update({
        where: { id: existingBoard.id },
        data: { morningBriefing: briefing },
      });
    } else {
      await prisma.dailyBoard.create({
        data: {
          tripId,
          date: dayStart,
          morningBriefing: briefing,
          checklist: "[]",
          reminders: "[]",
        },
      });
    }

    return NextResponse.json({ data: { briefing } });
  } catch (err) {
    console.error("[daily/briefing] error:", err);
    return NextResponse.json({ error: "Failed to generate briefing" }, { status: 502 });
  }
}
