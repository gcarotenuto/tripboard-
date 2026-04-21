"use client";

import { useState } from "react";
import useSWR from "swr";
import { Spinner } from "@tripboard/ui";

interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
  order: number;
}

interface TripEvent {
  id: string;
  title: string;
  type: string;
  startsAt: string | null;
  locationName: string | null;
}

interface DailyData {
  tripId: string;
  tripTitle: string;
  id: string | null;
  date: string;
  morningBriefing: string | null;
  checklist: ChecklistItem[];
  reminders: Array<{ id: string; text: string; acknowledged: boolean }>;
  daySummary: string | null;
  events: TripEvent[];
}

const EVENT_TYPE_EMOJI: Record<string, string> = {
  FLIGHT: "✈️", TRAIN: "🚄", BUS: "🚌", FERRY: "⛴️", CAR: "🚗",
  HOTEL: "🏨", ACCOMMODATION: "🏡", ACTIVITY: "🎯", FOOD: "🍽️",
  MEETING: "🤝", OTHER: "📌",
};

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((r) => r.data);

export function DailyBoardView() {
  const today = new Date().toISOString().split("T")[0];
  const { data, isLoading } = useSWR<DailyData | null>(
    `/api/daily?date=${today}`,
    fetcher
  );

  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);

  const items = checklist.length ? checklist : (data?.checklist ?? []);

  const toggleItem = (id: string) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, done: !item.done } : item
    );
    setChecklist(updated);
  };

  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>;

  if (!data) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-10 text-center">
        <p className="text-2xl mb-2">🌴</p>
        <p className="text-sm text-zinc-400 dark:text-zinc-500">No active trip today.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trip badge */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-indigo-100 dark:bg-indigo-900/40 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
          ✈️ {data.tripTitle}
        </span>
      </div>

      {/* Morning briefing */}
      {data.morningBriefing && (
        <section className="rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 border border-indigo-100 dark:border-indigo-900 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-2">
            Morning Briefing
          </p>
          <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
            {data.morningBriefing}
          </p>
        </section>
      )}

      {/* Today's events */}
      {data.events.length > 0 && (
        <section>
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-3">
            Today&apos;s Schedule
          </p>
          <div className="space-y-2">
            {data.events.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 rounded-xl border border-zinc-200/60 bg-white dark:border-zinc-800 dark:bg-zinc-900 px-4 py-3"
              >
                <span className="text-lg shrink-0 mt-0.5">
                  {EVENT_TYPE_EMOJI[event.type] ?? "📌"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    {event.title}
                  </p>
                  {event.locationName && (
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">{event.locationName}</p>
                  )}
                </div>
                {event.startsAt && (
                  <span className="text-xs text-zinc-400 dark:text-zinc-500 shrink-0">
                    {new Date(event.startsAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Reminders */}
      {data.reminders?.filter((r) => !r.acknowledged).length ? (
        <section>
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-2">
            Reminders
          </p>
          <div className="space-y-2">
            {data.reminders
              .filter((r) => !r.acknowledged)
              .map((reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900 px-4 py-3"
                >
                  <span>⚠️</span>
                  <p className="text-sm text-amber-800 dark:text-amber-300">{reminder.text}</p>
                </div>
              ))}
          </div>
        </section>
      ) : null}

      {/* Checklist */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-3">
          Today&apos;s Checklist
        </p>
        {items.length ? (
          <div className="space-y-2">
            {items
              .sort((a, b) => a.order - b.order)
              .map((item) => (
                <label
                  key={item.id}
                  className="flex items-start gap-3 rounded-xl border border-zinc-200/60 bg-white dark:border-zinc-800 dark:bg-zinc-900 px-4 py-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => toggleItem(item.id)}
                    className="mt-0.5 h-4 w-4 rounded accent-indigo-600"
                  />
                  <span
                    className={`text-sm ${
                      item.done
                        ? "line-through text-zinc-400 dark:text-zinc-600"
                        : "text-zinc-800 dark:text-zinc-200"
                    }`}
                  >
                    {item.text}
                  </span>
                </label>
              ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-400 dark:text-zinc-500 py-2 text-center italic">
            No checklist for today.
          </p>
        )}
      </section>
    </div>
  );
}
