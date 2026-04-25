import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: { tripId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;

  const trip = await prisma.trip.findFirst({
    where: { id: params.tripId, userId, deletedAt: null },
    select: { id: true, title: true, primaryDestination: true },
  });
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { date, mood, title: entryTitle } = (await req.json()) as {
    date?: string;
    mood?: string;
    title?: string;
  };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "your-anthropic-api-key-here") {
    return NextResponse.json({ error: "AI not configured" }, { status: 503 });
  }

  // Get today's events for context
  const entryDate = date ?? new Date().toISOString().split("T")[0];
  const dayStart = new Date(`${entryDate}T00:00:00Z`);
  const dayEnd = new Date(`${entryDate}T23:59:59Z`);

  const events = await prisma.tripEvent.findMany({
    where: {
      tripId: params.tripId,
      startsAt: { gte: dayStart, lte: dayEnd },
      isDuplicate: false,
    },
    orderBy: { startsAt: "asc" },
    select: { title: true, type: true, locationName: true, notes: true },
    take: 10,
  });

  const eventList = events.length > 0
    ? events.map((e) => `- ${e.title}${e.locationName ? ` at ${e.locationName}` : ""}${e.notes ? ` (${e.notes})` : ""}`).join("\n")
    : null;

  const formattedDate = new Date(entryDate + "T12:00:00Z").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  const moodContext = mood ? ` Mood: ${mood}.` : "";
  const titleContext = entryTitle?.trim() ? ` Entry theme: "${entryTitle}".` : "";

  const prompt = `Write a vivid, personal first-person travel journal entry for a traveler on a trip called "${trip.title}" to ${trip.primaryDestination ?? "their destination"}.

Date: ${formattedDate}${moodContext}${titleContext}
${eventList ? `\nActivities today:\n${eventList}` : "\n(No specific events logged for this day)"}

Write 150-220 words. Capture the atmosphere, emotions, sensory details. First-person ("I", "We"). Authentic, reflective, not generic. No title, no headings — just the journal prose.`;

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
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      console.error("[ai-journal] Anthropic error:", await response.text());
      return NextResponse.json({ error: "AI request failed" }, { status: 502 });
    }

    const data = (await response.json()) as { content?: Array<{ type: string; text: string }> };
    const text = data.content?.find((b) => b.type === "text")?.text?.trim() ?? "";
    return NextResponse.json({ content: text });
  } catch (err) {
    console.error("[ai-journal]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
