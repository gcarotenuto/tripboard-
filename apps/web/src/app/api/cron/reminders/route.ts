import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeTripStatus } from "@/lib/tripStatus";

// NOTE: web-push is imported lazily inside the handler to avoid
// module-level VAPID validation during Next.js build's page-data collection.

// GET /api/cron/reminders — called by Vercel Cron every day at 09:00 UTC
export async function GET(req: Request) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vapidPublic = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT ?? "mailto:hello@tripboard.app";

  if (!vapidPublic || !vapidPrivate) {
    return NextResponse.json({ error: "VAPID keys not configured" }, { status: 500 });
  }

  // Lazy import to avoid module-level side-effects during build
  const webpush = (await import("web-push")).default;
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

  const now = new Date();

  // ── Step 1: auto-update all trip statuses ─────────────────────────────
  const allTrips = await prisma.trip.findMany({
    where: { deletedAt: null },
    select: { id: true, status: true, startsAt: true, endsAt: true },
  });
  const statusUpdates = allTrips
    .map((t) => ({ id: t.id, correct: computeTripStatus(t.status, t.startsAt, t.endsAt) }))
    .filter(({ id: _id, correct }, i) => correct !== allTrips[i].status);
  if (statusUpdates.length) {
    await Promise.all(
      statusUpdates.map(({ id, correct }) =>
        prisma.trip.update({ where: { id }, data: { status: correct } }).catch(() => {})
      )
    );
  }

  // ── Step 2: send push reminders ───────────────────────────────────────
  // Find upcoming trips starting in 1 day or 7 days
  const inOneDay = new Date(now);
  inOneDay.setDate(inOneDay.getDate() + 1);

  const inSevenDays = new Date(now);
  inSevenDays.setDate(inSevenDays.getDate() + 7);

  const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
  const dayEnd   = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

  const tripsStartingSoon = await prisma.trip.findMany({
    where: {
      deletedAt: null,
      status: { in: ["PLANNING", "UPCOMING"] },
      startsAt: { gte: dayStart(inOneDay), lte: dayEnd(inSevenDays) },
    },
    select: {
      id: true,
      title: true,
      primaryDestination: true,
      startsAt: true,
      user: {
        select: {
          id: true,
          pushSubscriptions: {
            select: { endpoint: true, p256dh: true, auth: true },
          },
        },
      },
    },
  });

  let sent = 0;
  let failed = 0;

  for (const trip of tripsStartingSoon) {
    if (!trip.user.pushSubscriptions.length) continue;

    const daysUntil = Math.ceil(
      (trip.startsAt!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysLabel = daysUntil === 1 ? "tomorrow" : `in ${daysUntil} days`;

    const payload = JSON.stringify({
      title: `✈️ ${trip.title} starts ${daysLabel}`,
      body: trip.primaryDestination
        ? `Your trip to ${trip.primaryDestination} is almost here!`
        : "Your trip is almost here — get ready!",
      tag: `trip-reminder-${trip.id}`,
      url: `/trips/${trip.id}`,
    });

    for (const sub of trip.user.pushSubscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        sent++;
      } catch (err: unknown) {
        // Remove stale subscriptions (410 Gone / 404 Not Found)
        const status = (err as { statusCode?: number })?.statusCode;
        if (status === 410 || status === 404) {
          await prisma.pushSubscription.deleteMany({ where: { endpoint: sub.endpoint } });
        }
        failed++;
      }
    }
  }

  return NextResponse.json({ data: { sent, failed, trips: tripsStartingSoon.length } });
}
