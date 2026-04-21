"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((r) => r.data);

interface TripStatsData {
  eventCount: number;
  documentCount: number;
  extractedDocumentCount?: number;
  expenseTotal: number;
  expenseCurrency: string;
  journalEntryCount: number;
  daysUntilTrip?: number;
  startsAt?: string | null;
}

function getDaysUntil(startsAt: string | null | undefined): number | null {
  if (!startsAt) return null;
  const diff = new Date(startsAt).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days;
}

export function TripStats({ tripId }: { tripId: string }) {
  const { data } = useSWR<TripStatsData>(`/api/trips/${tripId}/stats`, fetcher);

  const daysUntil = data ? getDaysUntil(data.startsAt) : null;
  const extractedDocs = data?.extractedDocumentCount ?? null;
  const totalDocs = data?.documentCount ?? 0;

  const stats = [
    {
      label: "Events",
      value: data?.eventCount ?? "—",
      emoji: "📅",
      sub: null,
    },
    {
      label: "Documents",
      value: data?.documentCount ?? "—",
      emoji: "🗄️",
      sub: extractedDocs !== null && totalDocs > 0
        ? `${extractedDocs}/${totalDocs} extracted`
        : null,
    },
    {
      label: "Journal entries",
      value: data?.journalEntryCount ?? "—",
      emoji: "📓",
      sub: null,
    },
    {
      label: "Total spend",
      value: data?.expenseTotal ? `${data.expenseTotal} ${data.expenseCurrency}` : "—",
      emoji: "💳",
      sub: null,
    },
  ];

  return (
    <div className="space-y-3">
      {/* Countdown banner if trip is upcoming */}
      {daysUntil !== null && daysUntil > 0 && daysUntil <= 30 && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 px-4 py-2.5 flex items-center gap-2">
          <span className="text-lg">⏳</span>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            {daysUntil === 1 ? "Trip starts tomorrow!" : `${daysUntil} days until departure`}
          </p>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-zinc-200/60 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-3"
          >
            <div className="text-xl mb-1">{stat.emoji}</div>
            <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-none">{stat.value}</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">{stat.label}</div>
            {stat.sub && (
              <div className="text-[11px] text-indigo-500 dark:text-indigo-400 mt-1 font-medium">{stat.sub}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
