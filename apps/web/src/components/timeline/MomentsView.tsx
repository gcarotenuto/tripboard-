"use client";

import useSWR from "swr";
import type { TripEvent, JournalEntry } from "@tripboard/shared";
import { formatDate, EVENT_TYPE_EMOJIS } from "@tripboard/shared";
import { Spinner } from "@tripboard/ui";

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((r) => r.data);

// Merge events and journal entries into a unified moments stream
type MomentItem =
  | { kind: "event"; data: TripEvent; date: string }
  | { kind: "journal"; data: JournalEntry; date: string };

function toDateKey(d: string | Date | null): string {
  if (!d) return "undated";
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toISOString().split("T")[0];
}

export function MomentsView({ tripId }: { tripId: string }) {
  const { data: events, isLoading: eventsLoading } = useSWR<TripEvent[]>(
    `/api/trips/${tripId}/events?view=MOMENTS`,
    fetcher
  );
  const { data: journal, isLoading: journalLoading } = useSWR<JournalEntry[]>(
    `/api/trips/${tripId}/journal`,
    fetcher
  );

  const isLoading = eventsLoading || journalLoading;

  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>;

  // Build unified stream
  const stream: MomentItem[] = [
    ...(events ?? []).map((e) => ({ kind: "event" as const, data: e, date: toDateKey(e.startsAt) })),
    ...(journal ?? []).map((j) => ({ kind: "journal" as const, data: j, date: toDateKey(j.entryDate) })),
  ];

  if (!stream.length) return (
    <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 p-12 text-center">
      <div className="text-4xl mb-3">✨</div>
      <h3 className="font-semibold text-zinc-800 dark:text-zinc-200">No moments yet</h3>
      <p className="mt-1 text-sm text-zinc-500">
        Add restaurants, activities, and journal entries to build your travel story.
      </p>
    </div>
  );

  // Group by date
  const byDate: Record<string, MomentItem[]> = {};
  for (const item of stream) {
    if (!byDate[item.date]) byDate[item.date] = [];
    byDate[item.date].push(item);
  }
  const sortedDays = Object.keys(byDate).sort();

  return (
    <div className="space-y-10">
      {sortedDays.map((day) => (
        <div key={day}>
          {/* Day header — immersive, story-first */}
          <div className="sticky top-0 z-10 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur py-2 mb-4">
            <div className="flex items-baseline gap-3">
              <p className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {day === "undated" ? "Undated" : formatDate(day)}
              </p>
              <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
            </div>
          </div>

          {/* Moments grid */}
          <div className="space-y-4">
            {byDate[day].map((item, i) => {
              if (item.kind === "journal") {
                return <JournalCard key={`j-${item.data.id}`} entry={item.data} />;
              }
              return <EventMomentCard key={`e-${item.data.id}`} event={item.data} />;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function JournalCard({ entry }: { entry: JournalEntry }) {
  const wordCount = entry.content.trim().split(/\s+/).length;
  const excerpt = entry.content.length > 320
    ? entry.content.slice(0, 320).trimEnd() + "…"
    : entry.content;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-indigo-50/60 to-violet-50/40 dark:from-indigo-950/30 dark:to-violet-950/20 border border-indigo-100 dark:border-indigo-900/50 p-5 relative overflow-hidden">
      {/* Quote mark */}
      <span className="absolute top-3 right-4 text-5xl font-serif text-indigo-200 dark:text-indigo-900 leading-none select-none">"</span>

      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        {entry.mood && (
          <span className="text-2xl" title="Mood">{entry.mood}</span>
        )}
        <div>
          {entry.title && (
            <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm leading-tight">
              {entry.title}
            </p>
          )}
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Journal · {wordCount} words
          </p>
        </div>
      </div>

      {/* Excerpt */}
      <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap relative z-10">
        {excerpt}
      </p>

      {/* Location */}
      {entry.locationName && (
        <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
          📍 {entry.locationName}
        </p>
      )}
    </div>
  );
}

function EventMomentCard({ event }: { event: TripEvent }) {
  const emoji = event.emoji ?? EVENT_TYPE_EMOJIS[event.type] ?? "✨";

  return (
    <div className="flex items-start gap-4 rounded-2xl border border-zinc-200/60 bg-white dark:border-zinc-800 dark:bg-zinc-900 px-4 py-4 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
      {/* Large emoji */}
      <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-2xl shrink-0">
        {emoji}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm leading-snug">
          {event.title}
        </p>
        {event.locationName && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            📍 {event.locationName}
          </p>
        )}
        {event.notes && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed italic">
            &ldquo;{event.notes}&rdquo;
          </p>
        )}
      </div>

      {event.startsAt && (
        <p className="text-xs text-zinc-400 dark:text-zinc-500 shrink-0 font-mono">
          {new Date(event.startsAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
        </p>
      )}
    </div>
  );
}
