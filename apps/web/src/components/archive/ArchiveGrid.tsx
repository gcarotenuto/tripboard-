"use client";

import useSWR from "swr";
import type { Trip } from "@tripboard/shared";
import { formatDate, getTripDurationDays } from "@tripboard/shared";
import Link from "next/link";
import { GenerateMemoryCapsuleButton } from "./GenerateMemoryCapsuleButton";

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

function ArchiveLoadingSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800 overflow-hidden">
          <div className="h-28 bg-zinc-100 dark:bg-zinc-800" />
          <div className="p-5 space-y-3">
            <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded" />
            <div className="h-3 w-5/6 bg-zinc-100 dark:bg-zinc-800 rounded" />
            <div className="flex gap-3 pt-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="h-8 w-16 bg-zinc-100 dark:bg-zinc-800 rounded" />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ArchiveGrid() {
  const { data: trips, isLoading } = useSWR<Trip[]>(
    "/api/trips?status=COMPLETED,ARCHIVED",
    fetcher
  );

  if (isLoading) return <ArchiveLoadingSkeleton />;

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

  // Pick a gradient per trip (stable, based on title length)
  const gradients = [
    "from-violet-500/20 via-indigo-500/15 to-sky-500/10 dark:from-violet-900/40 dark:via-indigo-900/30 dark:to-sky-900/20",
    "from-rose-500/20 via-pink-500/15 to-fuchsia-500/10 dark:from-rose-900/40 dark:via-pink-900/30 dark:to-fuchsia-900/20",
    "from-amber-500/20 via-orange-500/15 to-red-500/10 dark:from-amber-900/40 dark:via-orange-900/30 dark:to-red-900/20",
    "from-teal-500/20 via-emerald-500/15 to-green-500/10 dark:from-teal-900/40 dark:via-emerald-900/30 dark:to-green-900/20",
  ];
  const gradient = gradients[trip.title.length % gradients.length];

  return (
    <div className="group rounded-2xl border border-zinc-200/60 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-lg transition-all">
      {/* Gradient header */}
      <Link href={`/trips/${trip.id}`}>
        <div className={`h-28 bg-gradient-to-br ${gradient} flex items-end px-6 py-4 relative overflow-hidden cursor-pointer`}>
          {/* Ghost emoji backdrop */}
          <span className="absolute right-4 top-2 text-7xl opacity-10 select-none">🗺️</span>

          <div className="relative z-10 flex-1 min-w-0">
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-lg leading-tight group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors truncate pr-32">
              {trip.title}
            </h3>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              {trip.primaryDestination && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{trip.primaryDestination}</p>
              )}
              {trip.startsAt && (
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  {formatDate(trip.startsAt)}
                  {duration ? ` · ${duration} days` : ""}
                </p>
              )}
              <span className={`text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5 ${
                trip.status === "COMPLETED"
                  ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
              }`}>
                {trip.status}
              </span>
            </div>
          </div>

          {/* Memory capsule badge */}
          {capsule && (
            <span className="absolute top-3 right-4 inline-flex items-center gap-1 rounded-full bg-indigo-600/90 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
              ✦ Memory Capsule
            </span>
          )}
        </div>
      </Link>

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
                  <span className="text-indigo-400 dark:text-indigo-500 shrink-0 mt-0.5 text-xs">◆</span>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">{h}</p>
                </div>
              ))}
            </div>
          )}

          {/* Stats row */}
          {capsule.stats && (
            <div className="flex flex-wrap gap-5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              {capsule.stats.citiesVisited != null && (
                <Stat value={capsule.stats.citiesVisited} label="cities" />
              )}
              {capsule.stats.totalDays != null && (
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

          {/* Regenerate button */}
          <div className="pt-1 flex justify-end">
            <GenerateMemoryCapsuleButton tripId={trip.id} hasExisting={true} />
          </div>
        </div>
      ) : (
        <div className="px-5 py-5 flex items-center justify-between gap-4">
          <p className="text-sm text-zinc-400 dark:text-zinc-500 italic">
            No Memory Capsule yet — let AI craft yours.
          </p>
          <GenerateMemoryCapsuleButton tripId={trip.id} hasExisting={false} />
        </div>
      )}
    </div>
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
