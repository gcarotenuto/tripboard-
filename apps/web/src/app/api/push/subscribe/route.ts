import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST — save a new push subscription
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const body = await req.json();
  const endpoint: string = body.endpoint;
  const p256dh: string = body.keys?.p256dh;
  const auth: string = body.keys?.auth;

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { userId, p256dh, auth },
    create: { userId, endpoint, p256dh, auth },
  });

  return NextResponse.json({ data: { ok: true } });
}

// DELETE — remove push subscription
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const body = await req.json().catch(() => ({}));
  const endpoint: string | undefined = body.endpoint;

  if (endpoint) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint, userId } });
  } else {
    // Delete all subscriptions for this user
    await prisma.pushSubscription.deleteMany({ where: { userId } });
  }

  return NextResponse.json({ data: { ok: true } });
}
