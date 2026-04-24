import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const VALID_CATEGORIES = ["CLOTHING", "ELECTRONICS", "DOCUMENTS", "TOILETRIES", "HEALTH", "OTHER"] as const;
type PackingCategory = typeof VALID_CATEGORIES[number];

interface SuggestedItem {
  name: string;
  category: PackingCategory;
  quantity: number;
}

const SYSTEM_PROMPT = `You are a smart travel assistant helping pack for a trip.
Generate a practical, well-organized packing list as a JSON array.

Each item must follow this schema:
{
  "name": "<item name, specific and concise, max 40 chars>",
  "category": "CLOTHING" | "ELECTRONICS" | "DOCUMENTS" | "TOILETRIES" | "HEALTH" | "OTHER",
  "quantity": <integer, usually 1>
}

Rules:
- Respond ONLY with a valid JSON array — no markdown, no extra text
- 20-35 items total, grouped logically by category
- Be specific (e.g. "Universal power adapter" not just "adapter")
- Clothing quantities should reflect trip duration (e.g. 3 T-shirts for 7 days)
- Always include: passport/ID, travel insurance docs, phone charger, medications
- Adapt items to the destination climate and activities
- Skip generic always-on-you items (keys, phone, wallet)
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
    select: { id: true, title: true, primaryDestination: true, startsAt: true, endsAt: true },
  });
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "your-anthropic-api-key-here") {
    return NextResponse.json({ error: "AI not configured" }, { status: 503 });
  }

  const startsAt = trip.startsAt ?? new Date();
  const endsAt = trip.endsAt ?? new Date(startsAt.getTime() + 7 * 86400000);
  const days = Math.max(1, Math.round((endsAt.getTime() - startsAt.getTime()) / 86400000));
  const dest = trip.primaryDestination ?? "unknown destination";

  const prompt = `Trip: "${trip.title}"
Destination: ${dest}
Duration: ${days} day${days !== 1 ? "s" : ""}

Generate the packing list JSON array now.`;

  let items: SuggestedItem[] = [];

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
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      console.error("[ai-packing] Anthropic error:", await response.text());
      return NextResponse.json({ error: "AI request failed" }, { status: 502 });
    }

    const data = (await response.json()) as { content?: Array<{ type: string; text: string }> };
    const raw = data.content?.find((b) => b.type === "text")?.text?.trim() ?? "";
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
    const parsed = JSON.parse(cleaned) as unknown[];

    if (!Array.isArray(parsed)) throw new Error("not an array");

    items = parsed
      .filter((i): i is SuggestedItem => typeof (i as SuggestedItem).name === "string")
      .map((i) => ({
        name: String(i.name).slice(0, 60),
        category: VALID_CATEGORIES.includes(i.category as PackingCategory)
          ? i.category as PackingCategory
          : "OTHER",
        quantity: Math.max(1, Math.min(20, Number(i.quantity) || 1)),
      }));
  } catch (err) {
    console.error("[ai-packing] error:", err);
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 502 });
  }

  // Ensure packing list exists
  let packingList = await prisma.packingList.findUnique({ where: { tripId: params.tripId } });
  if (!packingList) {
    packingList = await prisma.packingList.create({ data: { tripId: params.tripId } });
  }

  // Remove previously AI-suggested items to avoid duplicates on re-run
  // (Items with notes = "__AI__")
  await prisma.packingItem.deleteMany({
    where: { listId: packingList.id, notes: "__AI__" },
  });

  // Create items, grouped by category with order
  const categoryCounters: Record<string, number> = {};
  const created = await prisma.$transaction(
    items.map((item) => {
      const cat = item.category;
      categoryCounters[cat] = (categoryCounters[cat] ?? 0) + 1;
      return prisma.packingItem.create({
        data: {
          listId: packingList!.id,
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          notes: "__AI__",
          order: categoryCounters[cat],
        },
      });
    })
  );

  return NextResponse.json({ data: { count: created.length } });
}
