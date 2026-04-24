import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function toICalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export async function GET(_req: Request, { params }: { params: { tripId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const trip = await prisma.trip.findFirst({
    where: { id: params.tripId, userId, deletedAt: null },
    select: {
      id: true,
      title: true,
      events: {
        select: {
          id: true,
          title: true,
          startsAt: true,
          endsAt: true,
          notes: true,
          locationName: true,
        },
        orderBy: { startsAt: "asc" },
      },
    },
  });

  if (!trip) {
    return new Response("Not found", { status: 404 });
  }

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TripBoard//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeICalText(trip.title)}`,
  ];

  for (const event of trip.events) {
    const startDate = event.startsAt ?? new Date();
    const endDate = event.endsAt ?? new Date(startDate.getTime() + 60 * 60 * 1000);

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${event.id}@tripboard`);
    lines.push(`DTSTART:${toICalDate(startDate)}`);
    lines.push(`DTEND:${toICalDate(endDate)}`);
    lines.push(`SUMMARY:${escapeICalText(event.title)}`);
    if (event.notes) {
      lines.push(`DESCRIPTION:${escapeICalText(event.notes)}`);
    }
    if (event.locationName) {
      lines.push(`LOCATION:${escapeICalText(event.locationName)}`);
    }
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");

  const icsContent = lines.join("\r\n");
  const filename = trip.title.replace(/[^a-z0-9]/gi, "-").toLowerCase();

  return new Response(icsContent, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.ics"`,
    },
  });
}
