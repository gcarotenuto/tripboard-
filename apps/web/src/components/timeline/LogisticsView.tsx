"use client";

import useSWR from "swr";
import type { TripEvent } from "@tripboard/shared";
import {
  formatDate,
  formatTime,
  groupEventsByDay,
  EVENT_TYPE_EMOJIS,
  EVENT_TYPE_LABELS,
} from "@tripboard/shared";
import { Spinner } from "@tripboard/ui";

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((r) => r.data);

// Derive operational status from event data
function getEventStatus(event: TripEvent): { label: string; color: string; icon: string } {
  const now = new Date();
  const start = event.startsAt ? new Date(event.startsAt) : null;
  const hoursUntil = start ? (start.getTime() - now.getTime()) / 1000 / 3600 : null;

  // Check-in window logic for flights/hotels
  if (event.type === "FLIGHT" && hoursUntil !== null) {
    if (hoursUntil < 0) return { label: "Departed", color: "text-zinc-400", icon: "✓" };
    if (hoursUntil <= 24 && hoursUntil > 0) return { label: "Check-in open", color: "text-amber-600 dark:text-amber-400", icon: "⏰" };
  }
  if (event.type === "HOTEL" && hoursUntil !== null) {
    if (hoursUntil < 0) return { label: "Checked in", color: "text-zinc-400", icon: "✓" };
    if (hoursUntil <= 4 && hoursUntil > 0) return { label: "Check-in today", color: "text-amber-600 dark:text-amber-400", icon: "⏰" };
  }

  if (event.confidence !== null && event.confidence < 0.7) {
    return { label: "Needs review", color: "text-red-500 dark:text-red-400", icon: "⚠️" };
  }

  return { label: "Confirmed", color: "text-emerald-600 dark:text-emerald-500", icon: "✓" };
}

function SourceBadge({ source, confidence }: { source: string | null; confidence: number | null }) {
  const src = source?.toLowerCase() ?? "manual";
  const label = src === "email" ? "EMAIL" : src === "pdf_upload" ? "PDF" : src === "pdf" ? "PDF" : "MANUAL";
  const bgClass =
    label === "EMAIL" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400"
    : label === "PDF" ? "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400"
    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";

  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide ${bgClass}`}>
      {label}
      {confidence !== null && (
        <span className="ml-1 opacity-60">{Math.round(confidence * 100)}%</span>
      )}
    </span>
  );
}

export function LogisticsView({ tripId }: { tripId: string }) {
  const { data: events, isLoading, error } = useSWR<TripEvent[]>(
    `/api/trips/${tripId}/events?view=LOGISTICS`,
    fetcher
  );

  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>;

  if (error) return (
    <div className="rounded-2xl bg-red-50 dark:bg-red-950/20 p-6 text-center">
      <p className="text-sm text-red-500">Failed to load logistics.</p>
    </div>
  );

  if (!events?.length) return (
    <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 p-12 text-center">
      <div className="text-4xl mb-3">📋</div>
      <h3 className="font-semibold text-zinc-800 dark:text-zinc-200">No bookings yet</h3>
      <p className="mt-1 text-sm text-zinc-500">
        Upload a booking confirmation or forward an email to add your first event.
      </p>
    </div>
  );

  const grouped = groupEventsByDay(events as unknown as Array<{ startsAt: string | null; [key: string]: unknown }>);
  const sortedDays = Object.keys(grouped).sort();

  // Surface items needing attention
  const needsAttention = events.filter(e => e.confidence !== null && e.confidence < 0.7);

  return (
    <div className="space-y-6">
      {/* Needs attention banner */}
      {needsAttention.length > 0 && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 flex items-start gap-3">
          <span className="text-lg shrink-0">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              {needsAttention.length} item{needsAttention.length > 1 ? "s" : ""} need your review
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              Low extraction confidence — check the details are correct before you travel.
            </p>
          </div>
        </div>
      )}

      {sortedDays.map((day) => (
        <div key={day}>
          {/* Day header */}
          <div className="sticky top-0 z-10 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur py-2 mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
              {day === "undated" ? "Undated" : formatDate(day)}
            </p>
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              {(grouped[day] as unknown as TripEvent[]).length} event{(grouped[day] as unknown as TripEvent[]).length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Events */}
          <div className="space-y-2">
            {(grouped[day] as unknown as TripEvent[]).map((event) => {
              const status = getEventStatus(event);
              const emoji = event.emoji ?? EVENT_TYPE_EMOJIS[event.type] ?? "📌";
              const label = EVENT_TYPE_LABELS[event.type] ?? event.type;

              return (
                <div
                  key={event.id}
                  className={`rounded-xl border bg-white dark:bg-zinc-900 px-4 py-3 transition-colors ${
                    event.confidence !== null && event.confidence < 0.7
                      ? "border-amber-200 dark:border-amber-900"
                      : "border-zinc-200/60 dark:border-zinc-800 hover:border-indigo-200 dark:hover:border-indigo-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Type emoji */}
                    <span className="text-xl shrink-0">{emoji}</span>

                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {event.title}
                        </p>
                        <SourceBadge source={event.sourceType} confidence={event.confidence} />
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">{label}</span>
                        {event.locationName && (
                          <span className="text-xs text-zinc-400 dark:text-zinc-500">📍 {event.locationName}</span>
                        )}
                      </div>
                    </div>

                    {/* Right: time + status */}
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                        {event.startsAt ? formatTime(event.startsAt, event.timezone ?? undefined) : "All day"}
                      </p>
                      <p className={`text-xs font-medium mt-0.5 ${status.color}`}>
                        {status.icon} {status.label}
                      </p>
                    </div>
                  </div>

                  {/* Notes */}
                  {event.notes && (
                    <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500 pl-9 italic">
                      {event.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
