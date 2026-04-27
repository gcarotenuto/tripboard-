"use client";

import useSWR from "swr";
import Link from "next/link";
import type { TripEvent, JournalEntry } from "@tripboard/shared";
import { formatDate, EVENT_TYPE_EMOJIS } from "@tripboard/shared";

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

  if (isLoading) return (
    <div className="space-y-10 animate-pulse">
      {[1, 2].map((day) => (
        <div key={day}>
          <div className="h-3 w-28 bg-zinc-200 dark:bg-zinc-700 rounded mb-4" />
          <div className="space-y-3 pl-4 border-l-2 border-zinc-100 dark:border-zinc-800">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex gap-3">
                <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-36 bg-zinc-200 dark:bg-zinc-700 rounded" />
                  <div className="h-3 w-24 bg-zinc-100 dark:bg-zinc-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  // Build unified stream
  const stream: MomentItem[] = [
    ...(events ?? []).map((e) => ({ kind: "event" as const, data: e, date: toDateKey(e.startsAt) })),
    ...(journal ?? []).map((j) => ({ kind: "journal" as const, data: j, date: toDateKey(j.entryDate) })),
  ];

  if (!stream.length) return (
    <div className="rounded-2xl border border-zinc-200/70 dark:border-zinc-800 overflow-hidden">
      {/* Story hero */}
      <div className="bg-gradient-to-br from-violet-50/80 via-pink-50/40 to-rose-50/30 dark:from-violet-950/30 dark:via-pink-950/20 dark:to-rose-950/10 px-8 py-7 text-center">
        <div className="text-5xl mb-3">✨</div>
        <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">Your travel story starts here</h3>
        <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
          Activities, restaurants, and journal entries blend into a rich day-by-day diary of your trip.
        </p>
      </div>

      {/* Action cards */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-start gap-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 p-3.5">
            <span className="text-xl shrink-0">🍽️</span>
            <div>
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Add activities</p>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 leading-snug">
                Restaurants, sightseeing, shows — tap{" "}
                <span className="font-medium text-indigo-600 dark:text-indigo-400">+ Add Event</span>{" "}
                above
              </p>
            </div>
          </div>

          <Link
            href={`/trips/${tripId}/journal`}
            className="group flex items-start gap-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 p-3.5 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all"
          >
            <span className="text-xl shrink-0">📝</span>
            <div>
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">
                Write journal
              </p>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 leading-snug">
                Capture moods, reflections, and memories
              </p>
            </div>
          </Link>
        </div>

        {/* Preview of what appears here */}
        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wide font-medium">What you'll see</p>
          <div className="flex gap-1.5 flex-wrap">
            {["🗓 Events", "📓 Journal entries", "📍 Locations"].map((tag) => (
              <span key={tag} className="text-[11px] rounded-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 px-2 py-0.5 text-zinc-500 dark:text-zinc-400">{tag}</span>
            ))}
          </div>
        </div>
      </div>
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
