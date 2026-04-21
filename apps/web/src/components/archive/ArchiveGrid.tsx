"use client";

import useSWR from "swr";
import type { Trip } from "@tripboard/shared";
import { formatDate, getTripDurationDays } from "@tripboard/shared";
import { Spinner } from "@tripboard/ui";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((r) => r.data);

interface MemoryCapsuleData {
  summary: string;
  highlights?: string[];
  stats?: {
    totalDays?: number;
    citiesVisited?: number;
    totalExpenses?: number;
    currency?: string;
    journalEntries?: number;
  };
  generatedAt?: string;
}

function parseCapsule(raw: unknown): MemoryCapsuleData | null {
  if (!raw) return null;
  try {
    if (typeof raw === "string") return JSON.parse(raw);
    return raw as MemoryCapsuleData;
  } catch {
    return null;
  }
}

export function ArchiveGrid() {
  const { data: trips, isLoading } = useSWR<Trip[]>(
    "/api/trips?status=COMPLETED,ARCHIVED",
    fetcher
  );

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  if (!trips?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 p-16 text-center">
        <div className="text-5xl mb-4">🗺️</div>
        <h3 className="font-semibold text-zinc-800 dark:text-zinc-200 text-lg">Archive is empty</h3>
        <p className="mt-2 text-sm text-zinc-500 max-w-sm mx-auto">
          When you complete a trip, TripBoard creates a permanent Memory Capsule — your documents, story, and stats preserved forever.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {trips.map((trip) => (
        <MemoryCapsuleCard key={trip.id} trip={trip} />
      ))}
    </div>
  );
}

function MemoryCapsuleCard({ trip }: { trip: Trip }) {
  const duration =
    trip.startsAt && trip.endsAt
      ? getTripDurationDays(trip.startsAt, trip.endsAt)
      : null;

  const capsule = parseCapsule(trip.memoryCapsule);

  return (
    <Link href={`/trips/${trip.id}`}>
      <div className="group rounded-2xl border border-zinc-200/60 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-lg transition-all">
        {/* Gradient header */}
        <div className="h-28 bg-gradient-to-br from-violet-500/20 via-indigo-500/15 to-sky-500/10 dark:from-violet-900/40 dark:via-indigo-900/30 dark:to-sky-900/20 flex items-end px-6 py-4 relative overflow-hidden">
          {/* Large ghost emoji */}
          <span className="absolute right-4 top-2 text-6xl opacity-10 select-none">🗺️</span>

          <div className="relative z-10">
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-lg leading-tight group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
              {trip.title}
            </h3>
            <div className="flex items-center gap-3 mt-0.5">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{trip.primaryDestination}</p>
              {trip.startsAt && (
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  {formatDate(trip.startsAt)}
                  {duration ? ` · ${duration} days` : ""}
                </p>
              )}
            </div>
          </div>

          {/* Memory capsule badge */}
          {capsule && (
            <span className="absolute top-3 right-4 inline-flex items-center gap-1 rounded-full bg-indigo-600/90 px-2.5 py-1 text-[11px] font-semibold text-white">
              ✦ Memory Capsule
            </span>
          )}
        </div>

        {/* Capsule body */}
        {capsule ? (
          <div className="p-5 space-y-4">
            {/* Summary */}
            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {capsule.summary}
            </p>

            {/* Highlights */}
            {capsule.highlights && capsule.highlights.length > 0 && (
              <div className="space-y-1.5">
                {capsule.highlights.slice(0, 3).map((h, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-indigo-400 dark:text-indigo-500 shrink-0 mt-0.5">◆</span>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">{h}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Stats row */}
            {capsule.stats && (
              <div className="flex flex-wrap gap-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                {capsule.stats.citiesVisited && (
                  <Stat value={capsule.stats.citiesVisited} label="cities" />
                )}
                {capsule.stats.totalDays && (
                  <Stat value={capsule.stats.totalDays} label="days" />
                )}
                {capsule.stats.journalEntries != null && (
                  <Stat value={capsule.stats.journalEntries} label="journal entries" />
                )}
                {capsule.stats.totalExpenses != null && (
                  <Stat
                    value={`${capsule.stats.totalExpenses.toLocaleString()} ${capsule.stats.currency ?? ""}`}
                    label="total spent"
                  />
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="px-5 py-4">
            <p className="text-sm text-zinc-500 dark:text-zinc-400 italic">
              Memory Capsule not yet generated.
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div>
      <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{value}</p>
      <p className="text-xs text-zinc-400 dark:text-zinc-500">{label}</p>
    </div>
  );
}
