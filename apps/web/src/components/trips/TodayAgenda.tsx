"use client";

import Link from "next/link";
import useSWR from "swr";
import { ArrowRight, CalendarCheck, CalendarClock } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((r) => r.data);

interface TripEvent {
  id: string;
  title: string;
  type: string;
  startsAt: string | null;
  endsAt: string | null;
  emoji: string | null;
  locationName: string | null;
}

const EVENT_TYPE_EMOJIS: Record<string, string> = {
  FLIGHT: "✈️",
  TRAIN: "🚂",
  BUS: "🚌",
  CAR_RENTAL: "🚗",
  FERRY: "⛴️",
  HOTEL: "🏨",
  ACCOMMODATION: "🏠",
  TRANSFER: "🚕",
  ACTIVITY: "🎯",
  RESTAURANT: "🍽️",
  MUSEUM: "🏛️",
  SHOPPING: "🛍️",
  OTHER: "📌",
};

function formatEventTime(startsAt: string | null): string {
  if (!startsAt) return "";
  const d = new Date(startsAt);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isPast(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

function daysUntil(dateStr: string): number {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - today.getTime()) / 86400000);
}

interface TodayAgendaProps {
  tripId: string;
  tripStatus: string;
}

// ── Upcoming trip events preview ───────────────────────────────────────────────

function UpcomingEventsPreview({ tripId }: { tripId: string }) {
  const { data: events } = useSWR<TripEvent[]>(
    `/api/trips/${tripId}/events`,
    fetcher
  );

  if (!events || events.length === 0) return null;

  // Sort and take first 3 future events
  const upcoming = events
    .filter((e) => e.startsAt && new Date(e.startsAt) > new Date())
    .sort((a, b) => new Date(a.startsAt!).getTime() - new Date(b.startsAt!).getTime())
    .slice(0, 3);

  if (upcoming.length === 0) return null;

  const firstEvent = upcoming[0];
  const daysAway = firstEvent.startsAt ? daysUntil(firstEvent.startsAt) : null;

  return (
    <div className="rounded-2xl border border-amber-200/70 dark:border-amber-900/60 bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-amber-100 dark:border-amber-900/40">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            Upcoming events
          </span>
          {daysAway !== null && daysAway <= 7 && (
            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
              {daysAway === 0 ? "Today!" : daysAway === 1 ? "Tomorrow" : `${daysAway}d`}
            </span>
          )}
        </div>
        <Link
          href={`/trips/${tripId}/timeline`}
          className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 transition-colors"
        >
          View all
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Event list */}
      <div className="px-5 py-4 space-y-2.5">
        {upcoming.map((event) => {
          const days = event.startsAt ? daysUntil(event.startsAt) : null;
          const emoji = event.emoji ?? EVENT_TYPE_EMOJIS[event.type] ?? "📌";
          const time = formatEventTime(event.startsAt);

          return (
            <div
              key={event.id}
              className="flex items-center gap-3 rounded-xl bg-white/60 dark:bg-zinc-900/40 px-3 py-2"
            >
              <span className="text-base shrink-0">{emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{event.title}</p>
                {event.locationName && (
                  <p className="text-xs text-zinc-400 dark:text-zinc-600 truncate">{event.locationName}</p>
                )}
              </div>
              <div className="shrink-0 text-right">
                {days !== null && days > 0 && (
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                    in {days}d
                  </p>
                )}
                {days === 0 && time && (
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">{time}</p>
                )}
                {days === 0 && !time && (
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Today</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Active trip today agenda ───────────────────────────────────────────────────

function ActiveTodayAgenda({ tripId }: { tripId: string }) {
  const { data: events } = useSWR<TripEvent[]>(
    `/api/trips/${tripId}/events`,
    fetcher
  );

  if (!events) return null;

  const todayEvents = events
    .filter((e) => isToday(e.startsAt))
    .sort((a, b) => {
      if (!a.startsAt) return 1;
      if (!b.startsAt) return -1;
      return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
    });

  // Find next upcoming event (today or future)
  const now = new Date();
  const todayLabel = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const nextEvent = todayEvents.find((e) => e.startsAt && !isPast(e.startsAt));

  // If no events today, find next future event
  const nextFutureEvent =
    todayEvents.length === 0
      ? events
          .filter((e) => e.startsAt && !isPast(e.startsAt) && !isToday(e.startsAt))
          .sort((a, b) => new Date(a.startsAt!).getTime() - new Date(b.startsAt!).getTime())[0] ?? null
      : null;

  return (
    <div className="rounded-2xl border border-emerald-200/60 dark:border-emerald-900/60 bg-gradient-to-br from-emerald-50/60 to-teal-50/40 dark:from-emerald-950/20 dark:to-teal-950/20 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-emerald-100 dark:border-emerald-900/40">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </div>
          <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
            Today's Agenda
          </span>
          <span className="text-xs text-emerald-600/70 dark:text-emerald-500 hidden sm:inline">
            · {todayLabel}
          </span>
        </div>
        <Link
          href={`/trips/${tripId}/timeline`}
          className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-200 transition-colors"
        >
          Full timeline
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Event list */}
      <div className="px-5 py-4">
        {todayEvents.length === 0 ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-emerald-700/60 dark:text-emerald-500">
              <CalendarCheck className="h-4 w-4 shrink-0" />
              <span>No events today — free day!</span>
            </div>
            {/* Show next upcoming event as a teaser */}
            {nextFutureEvent && (
              <div className="flex items-center gap-3 rounded-xl bg-white/40 dark:bg-zinc-900/30 px-3 py-2">
                <span className="text-base shrink-0">
                  {nextFutureEvent.emoji ?? EVENT_TYPE_EMOJIS[nextFutureEvent.type] ?? "📌"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 truncate">
                    Next: {nextFutureEvent.title}
                  </p>
                  {nextFutureEvent.startsAt && (
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-600">
                      {new Date(nextFutureEvent.startsAt).toLocaleDateString("en-US", {
                        weekday: "short", month: "short", day: "numeric",
                      })}
                    </p>
                  )}
                </div>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                  in {nextFutureEvent.startsAt ? daysUntil(nextFutureEvent.startsAt) : "?"}d
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {todayEvents.slice(0, 5).map((event) => {
              const past = event.startsAt ? isPast(event.startsAt) : false;
              const isNext = nextEvent?.id === event.id;
              const time = formatEventTime(event.startsAt);
              const emoji = event.emoji ?? EVENT_TYPE_EMOJIS[event.type] ?? "📌";

              return (
                <div
                  key={event.id}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 transition-all ${
                    isNext
                      ? "bg-emerald-100/80 dark:bg-emerald-900/30 ring-1 ring-emerald-300/50 dark:ring-emerald-700/50"
                      : past
                      ? "opacity-50"
                      : "bg-white/50 dark:bg-zinc-900/40"
                  }`}
                >
                  <span className="text-base shrink-0">{emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      past
                        ? "text-zinc-400 dark:text-zinc-600 line-through"
                        : "text-zinc-900 dark:text-zinc-100"
                    }`}>
                      {event.title}
                    </p>
                    {event.locationName && (
                      <p className="text-xs text-zinc-400 dark:text-zinc-600 truncate">{event.locationName}</p>
                    )}
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    {time && (
                      <span className={`text-xs tabular-nums font-medium ${
                        isNext
                          ? "text-emerald-700 dark:text-emerald-400"
                          : past
                          ? "text-zinc-400 dark:text-zinc-600"
                          : "text-zinc-500 dark:text-zinc-500"
                      }`}>
                        {time}
                      </span>
                    )}
                    {isNext && (
                      <span className="rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        NEXT
                      </span>
                    )}
                    {past && (
                      <span className="text-emerald-500 text-xs">✓</span>
                    )}
                  </div>
                </div>
              );
            })}
            {todayEvents.length > 5 && (
              <Link
                href={`/trips/${tripId}/timeline`}
                className="block text-center text-xs text-emerald-600 dark:text-emerald-500 hover:text-emerald-800 dark:hover:text-emerald-300 py-1 transition-colors"
              >
                +{todayEvents.length - 5} more events →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Public export ──────────────────────────────────────────────────────────────

export function TodayAgenda({ tripId, tripStatus }: TodayAgendaProps) {
  if (tripStatus === "ACTIVE") return <ActiveTodayAgenda tripId={tripId} />;
  if (tripStatus === "UPCOMING") return <UpcomingEventsPreview tripId={tripId} />;
  return null;
}
