import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { processEmailInline } from "@/lib/ingest-processor";
import { z } from "zod";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const body = await req.json();
  const Schema = z.object({
    from: z.string().optional().default(""),
    subject: z.string().min(1),
    body: z.string().min(1),
    tripId: z.string().uuid().optional(),
  });
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const result = await processEmailInline({ ...parsed.data, userId });
  return NextResponse.json({ data: result });
}
