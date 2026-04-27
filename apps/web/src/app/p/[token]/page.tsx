import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plane } from "lucide-react";

interface Props { params: { token: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const trip = await prisma.trip.findUnique({
    where: { shareToken: params.token },
    select: { title: true, description: true, primaryDestination: true, isPublic: true },
  });

  if (!trip || !trip.isPublic) return {};

  const dest = trip.primaryDestination ? ` · ${trip.primaryDestination}` : "";
  const title = `${trip.title}${dest} — TripBoard`;
  const description = trip.description ?? "View this travel itinerary on TripBoard";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "TripBoard",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

const EVENT_TYPE_EMOJI: Record<string, string> = {
  FLIGHT: "✈️", TRAIN: "🚄", BUS: "🚌", FERRY: "⛴️",
  CAR: "🚗", CAR_RENTAL: "🚗", HOTEL: "🏨", ACCOMMODATION: "🏡",
  ACTIVITY: "🎯", FOOD: "🍽️", RESTAURANT: "🍽️", TOUR: "🗺️",
  TRANSFER: "🚕", MEETING: "🤝", OTHER: "📌",
};

function formatDate(d: Date | null, opts?: Intl.DateTimeFormatOptions) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", opts ?? {
    month: "long", day: "numeric", year: "numeric",
  });
}

function formatTime(d: Date | null) {
  if (!d) return null;
  return new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export default async function PublicTripPage({ params }: Props) {
  const trip = await prisma.trip.findUnique({
    where: { shareToken: params.token },
    select: {
      id: true, title: true, description: true, status: true,
      primaryDestination: true, startsAt: true, endsAt: true,
      isPublic: true,
      user: { select: { name: true } },
      events: {
        where: { isDuplicate: false },
        orderBy: { startsAt: "asc" },
        select: {
          id: true, title: true, type: true,
          startsAt: true, endsAt: true, allDay: true,
          locationName: true, notes: true, emoji: true,
        },
      },
    },
  });

  if (!trip || !trip.isPublic) notFound();

  const startStr = formatDate(trip.startsAt);
  const endStr   = formatDate(trip.endsAt);
  const dateRange = startStr && endStr ? `${startStr} – ${endStr}` : startStr ?? "";

  // Group events by day
  const byDay = new Map<string, typeof trip.events>();
  for (const ev of trip.events) {
    const day = ev.startsAt
      ? new Date(ev.startsAt).toISOString().split("T")[0]
      : "TBD";
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(ev);
  }
  const days = [...byDay.entries()].sort(([a], [b]) => (a < b ? -1 : 1));

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-zinc-100">
      {/* Nav */}
      <header className="border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
              <Plane className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-sm text-zinc-100">TripBoard</span>
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            Plan your trip →
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 space-y-10">
        {/* Hero */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {trip.status === "ACTIVE" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Happening now
              </span>
            )}
            {trip.primaryDestination && (
              <span className="text-xs text-zinc-500">📍 {trip.primaryDestination}</span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            {trip.title}
          </h1>

          {dateRange && (
            <p className="text-zinc-400 text-sm">{dateRange}</p>
          )}

          {trip.description && (
            <p className="text-zinc-300 text-sm leading-relaxed max-w-xl">
              {trip.description}
            </p>
          )}

          {trip.user.name && (
            <p className="text-xs text-zinc-600">
              Planned by <span className="text-zinc-400 font-medium">{trip.user.name}</span>
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Events", value: trip.events.length },
            { label: "Days", value: days.length },
            { label: "Destinations", value: trip.primaryDestination ? 1 : 0 },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-center">
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Timeline */}
        {days.length > 0 ? (
          <div className="space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">
              Itinerary
            </h2>

            {days.map(([day, events]) => {
              const dayDate = day !== "TBD" ? new Date(day + "T00:00:00") : null;
              const dayLabel = dayDate
                ? dayDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
                : "Date TBD";

              return (
                <div key={day}>
                  {/* Day header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-px flex-1 bg-zinc-800" />
                    <span className="text-xs font-semibold text-zinc-400 whitespace-nowrap">
                      {dayLabel}
                    </span>
                    <div className="h-px flex-1 bg-zinc-800" />
                  </div>

                  {/* Events */}
                  <div className="space-y-2 pl-2">
                    {events.map((ev) => {
                      const emoji = ev.emoji ?? EVENT_TYPE_EMOJI[ev.type] ?? "📌";
                      const timeStr = formatTime(ev.startsAt);
                      return (
                        <div
                          key={ev.id}
                          className="flex items-start gap-3 rounded-xl border border-zinc-800/60 bg-zinc-900/40 px-4 py-3"
                        >
                          <span className="text-xl shrink-0 mt-0.5">{emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-zinc-100 leading-tight">
                              {ev.title}
                            </p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                              {timeStr && (
                                <span className="text-xs font-mono text-zinc-500">{timeStr}</span>
                              )}
                              {ev.locationName && (
                                <span className="text-xs text-zinc-500">📍 {ev.locationName}</span>
                              )}
                            </div>
                            {ev.notes && (
                              <p className="text-xs text-zinc-600 mt-1 leading-relaxed">{ev.notes}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-800 p-10 text-center">
            <p className="text-3xl mb-2">🗓️</p>
            <p className="text-sm text-zinc-500">No events added yet</p>
          </div>
        )}

        {/* CTA footer */}
        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-6 text-center space-y-3">
          <p className="text-lg font-bold text-white">Plan your own trip</p>
          <p className="text-sm text-zinc-400">
            TripBoard keeps your itinerary, documents, expenses and journal all in one place — for free.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            <Plane className="h-4 w-4" />
            Start planning →
          </Link>
        </div>
      </main>

      <footer className="border-t border-zinc-800/40 py-6 text-center">
        <p className="text-xs text-zinc-600">
          Made with{" "}
          <Link href="/" className="text-indigo-400 hover:text-indigo-300">TripBoard</Link>
          {" "}· Travel planning, simplified
        </p>
      </footer>
    </div>
  );
}
