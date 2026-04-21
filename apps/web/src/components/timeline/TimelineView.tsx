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

interface TimelineViewProps {
  tripId: string;
  view: "logistics" | "moments";
}

export function TimelineView({ tripId, view }: TimelineViewProps) {
  const { data: events, isLoading, error } = useSWR<TripEvent[]>(
    `/api/trips/${tripId}/events?view=${view.toUpperCase()}`,
    fetcher
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-red-50 dark:bg-red-950/20 p-6 text-center">
        <p className="text-sm text-red-500">Failed to load events.</p>
      </div>
    );
  }

  if (!events?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 p-12 text-center">
        <div className="text-4xl mb-3">{view === "logistics" ? "📅" : "✨"}</div>
        <h3 className="font-semibold text-zinc-800 dark:text-zinc-200">No events yet</h3>
        <p className="mt-1 text-sm text-zinc-500">
          {view === "logistics"
            ? "Import a booking confirmation to add your first event."
            : "Add restaurants, activities, and moments to your trip."}
        </p>
      </div>
    );
  }

  const groupInput = events.map(e => ({ ...e } as unknown as { startsAt: string | null; [key: string]: unknown }));
  const grouped = groupEventsByDay(groupInput);
  const sortedDays = Object.keys(grouped).sort();

  return (
    <div className="space-y-8">
      {sortedDays.map((day) => (
        <div key={day}>
          {/* Day header */}
          <div className="sticky top-0 z-10 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur py-2 mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
              {day === "undated" ? "Undated" : formatDate(day)}
            </p>
          </div>

          {/* Events for this day */}
          <div className="relative pl-4">
            <div className="timeline-line" />
            {(grouped[day] as unknown as TripEvent[]).map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function EventCard({ event }: { event: TripEvent }) {
  const emoji = event.emoji ?? EVENT_TYPE_EMOJIS[event.type] ?? "📌";
  const label = EVENT_TYPE_LABELS[event.type] ?? event.type;

  return (
    <div className="event-card group">
      <div className="rounded-2xl border border-zinc-200/60 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-4 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
        <div className="flex items-start gap-3">
          <span className="text-2xl shrink-0">{emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-medium text-zinc-900 dark:text-zinc-100 text-sm leading-tight">
                {event.title}
              </h4>
              <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-500 font-mono">
                {event.startsAt ? formatTime(event.startsAt, event.timezone ?? undefined) : "All day"}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
            {event.locationName && (
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                📍 {event.locationName}
              </p>
            )}
            {event.confidence !== null && event.confidence < 0.7 && (
              <p className="mt-1 text-xs text-amber-500">⚠️ Low extraction confidence — please review</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
