"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((r) => r.data);

interface TripStatsData {
  eventCount: number;
  documentCount: number;
  expenseTotal: number;
  expenseCurrency: string;
  journalEntryCount: number;
  daysUntilTrip?: number;
}

export function TripStats({ tripId }: { tripId: string }) {
  const { data } = useSWR<TripStatsData>(`/api/trips/${tripId}/stats`, fetcher);

  const stats = [
    { label: "Events", value: data?.eventCount ?? "—", emoji: "📅" },
    { label: "Documents", value: data?.documentCount ?? "—", emoji: "🗄️" },
    { label: "Journal entries", value: data?.journalEntryCount ?? "—", emoji: "📓" },
    {
      label: "Total spend",
      value: data?.expenseTotal ? `${data.expenseTotal} ${data.expenseCurrency}` : "—",
      emoji: "💳",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-zinc-200/60 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-3"
        >
          <div className="text-xl mb-1">{stat.emoji}</div>
          <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{stat.value}</div>
          <div className="text-xs text-zinc-500 dark:text-zinc-500">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
