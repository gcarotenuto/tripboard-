"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((r) => r.data);

interface UserStats {
  totalTrips: number;
  completedTrips: number;
  countriesCount: number;
  totalDays: number;
}

export function UserStatsStrip() {
  const { data } = useSWR<UserStats>("/api/user/stats", fetcher);

  if (!data || data.totalTrips === 0) return null;

  const stats = [
    { value: data.totalTrips, label: data.totalTrips === 1 ? "trip" : "trips", emoji: "✈️" },
    ...(data.countriesCount > 0 ? [{ value: data.countriesCount, label: data.countriesCount === 1 ? "country" : "countries", emoji: "🌍" }] : []),
    ...(data.totalDays > 0 ? [{ value: data.totalDays, label: "days traveled", emoji: "📅" }] : []),
    ...(data.completedTrips > 0 ? [{ value: data.completedTrips, label: "completed", emoji: "🏅" }] : []),
  ];

  return (
    <div className="mb-6 flex flex-wrap gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="flex items-center gap-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 px-3 py-1.5"
        >
          <span className="text-sm">{s.emoji}</span>
          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">{s.value}</span>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">{s.label}</span>
        </div>
      ))}
    </div>
  );
}
