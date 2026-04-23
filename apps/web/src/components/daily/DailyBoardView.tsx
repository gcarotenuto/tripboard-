"use client";

import { useState, useRef } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Spinner } from "@tripboard/ui";

interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
  order: number;
}

interface TripEventItem {
  id: string;
  title: string;
  type: string;
  startsAt: string | null;
  locationName: string | null;
}

interface DocBundle {
  id: string;
  filename: string;
  type: string;
  status: string;
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
  events: TripEventItem[];
  readyDocuments?: DocBundle[];
}

const EVENT_TYPE_EMOJI: Record<string, string> = {
  FLIGHT: "✈️", TRAIN: "🚄", BUS: "🚌", FERRY: "⛴️", CAR: "🚗", CAR_RENTAL: "🚗",
  HOTEL: "🏨", ACCOMMODATION: "🏡", ACTIVITY: "🎯", FOOD: "🍽️", RESTAURANT: "🍽️",
  TOUR: "🗺️", TRANSFER: "🚕", MEETING: "🤝", OTHER: "📌",
};

const DOC_TYPE_EMOJI: Record<string, string> = {
  BOOKING_CONFIRMATION: "🎫",
  FLIGHT_TICKET: "✈️",
  HOTEL_VOUCHER: "🏨",
  CAR_RENTAL: "🚗",
  VISA: "🛂",
  INSURANCE: "🛡️",
  RAIL_TICKET: "🚄",
  RECEIPT: "🧾",
  OTHER: "📄",
};

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((r) => r.data);

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export function DailyBoardView() {
  const today = new Date().toISOString().split("T")[0];
  const { data, isLoading, mutate } = useSWR<DailyData | null>(
    `/api/daily?date=${today}`,
    fetcher
  );

  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newItemText, setNewItemText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const items = checklist.length ? checklist : (data?.checklist ?? []);

  async function persistChecklist(updated: ChecklistItem[]) {
    if (!data?.tripId) return;
    setChecklist(updated);
    await fetch("/api/daily/checklist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tripId: data.tripId, date: today, checklist: updated }),
    });
    mutate();
  }

  const toggleItem = (id: string) => {
    const base = items.length ? items : (data?.checklist ?? []);
    const updated = base.map((item) =>
      item.id === id ? { ...item, done: !item.done } : item
    );
    persistChecklist(updated);
  };

  const addItem = async () => {
    const text = newItemText.trim();
    if (!text) return;
    const base = items.length ? items : (data?.checklist ?? []);
    const maxOrder = base.reduce((m, i) => Math.max(m, i.order), -1);
    const newItem: ChecklistItem = { id: generateId(), text, done: false, order: maxOrder + 1 };
    const updated = [...base, newItem];
    setNewItemText("");
    await persistChecklist(updated);
    inputRef.current?.focus();
  };

  const doneCount = items.filter((i) => i.done).length;

  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>;

  if (!data) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-12 text-center">
        <p className="text-3xl mb-3">🌴</p>
        <p className="font-semibold text-zinc-700 dark:text-zinc-300 mb-1">No active trip today</p>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 max-w-xs mx-auto">
          When you have an active trip covering today, your operational briefing will appear here.
        </p>
      </div>
    );
  }

  const unacknowledgedReminders = data.reminders?.filter((r) => !r.acknowledged) ?? [];
  const hasDocuments = (data.readyDocuments?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      {/* Trip badge */}
      <div className="flex items-center justify-between">
        <Link
          href={`/trips/${data.tripId}`}
          className="inline-flex items-center rounded-full bg-indigo-100 dark:bg-indigo-900/40 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/60 transition-colors"
        >
          ✈️ {data.tripTitle}
        </Link>
        <span className="text-xs text-zinc-400 dark:text-zinc-500">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </span>
      </div>

      {/* Urgent reminders */}
      {unacknowledgedReminders.length > 0 && (
        <section>
          {unacknowledgedReminders.map((reminder) => (
            <div
              key={reminder.id}
              className="flex items-start gap-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3"
            >
              <span className="text-lg shrink-0">⏰</span>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">{reminder.text}</p>
            </div>
          ))}
        </section>
      )}

      {/* Morning briefing */}
      {data.morningBriefing && (
        <section className="rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 border border-indigo-100 dark:border-indigo-900 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-2">
            ☀️ Today&apos;s Briefing
          </p>
          <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
            {data.morningBriefing}
          </p>
        </section>
      )}

      {/* Today's events */}
      {data.events.length > 0 && (
        <section>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-3">
            📅 Today&apos;s Schedule
          </p>
          <div className="space-y-2">
            {data.events.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-3 rounded-xl border border-zinc-200/60 bg-white dark:border-zinc-800 dark:bg-zinc-900 px-4 py-3"
              >
                <span className="text-lg shrink-0">
                  {EVENT_TYPE_EMOJI[event.type] ?? "📌"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    {event.title}
                  </p>
                  {event.locationName && (
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">📍 {event.locationName}</p>
                  )}
                </div>
                {event.startsAt && (
                  <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500 shrink-0">
                    {new Date(event.startsAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Documents ready today */}
      {hasDocuments && (
        <section>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-3">
            📦 Documents Ready Today
          </p>
          <div className="grid grid-cols-1 gap-2">
            {(data.readyDocuments ?? []).map((doc) => (
              <Link
                key={doc.id}
                href={`/trips/${data.tripId}/vault`}
                className="flex items-center gap-3 rounded-xl border border-zinc-200/60 bg-white dark:border-zinc-800 dark:bg-zinc-900 px-4 py-3 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors group"
              >
                <span className="text-xl shrink-0">
                  {DOC_TYPE_EMOJI[doc.type] ?? "📄"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 truncate">
                    {doc.filename}
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">Tap to open in Vault →</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Checklist with progress */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            ✅ Today&apos;s Checklist
          </p>
          {items.length > 0 && (
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              {doneCount}/{items.length} done
            </span>
          )}
        </div>

        {/* Progress bar */}
        {items.length > 0 && (
          <div className="h-1 rounded-full bg-zinc-200 dark:bg-zinc-800 mb-3 overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${items.length ? (doneCount / items.length) * 100 : 0}%` }}
            />
          </div>
        )}

        <div className="space-y-2">
          {items.length > 0 && items
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

          {/* Add item input */}
          <div className="flex items-center gap-2 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5">
            <input
              ref={inputRef}
              type="text"
              className="flex-1 bg-transparent text-sm text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none"
              placeholder="Add item…"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addItem(); }}
            />
            <button
              onClick={addItem}
              disabled={!newItemText.trim()}
              className="text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-30 transition-colors"
              title="Add item"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
