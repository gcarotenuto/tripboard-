import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, destination } = (await req.json()) as { title?: string; destination?: string };
  if (!title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "your-anthropic-api-key-here") {
    return NextResponse.json({ error: "AI not configured" }, { status: 503 });
  }

  const destPart = destination?.trim() ? ` to ${destination.trim()}` : "";

  const prompt = `Write a short, vivid trip description (2–3 sentences, max 80 words) for a trip called "${title}"${destPart}.

Tone: enthusiastic but concise, written in first or second person, no generic filler. Focus on what makes this destination or trip special. Do NOT include any markdown, quotes, or formatting — just plain text.`;

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
        max_tokens: 200,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[ai/describe] Anthropic error:", err);
      return NextResponse.json({ error: "AI request failed" }, { status: 502 });
    }

    const data = (await response.json()) as {
      content?: Array<{ type: string; text: string }>;
    };

    const text = data.content?.find((b) => b.type === "text")?.text?.trim() ?? "";
    return NextResponse.json({ description: text });
  } catch (err) {
    console.error("[ai/describe]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
