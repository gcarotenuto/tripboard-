"use client";

import useSWR from "swr";
import type { Trip } from "@tripboard/shared";
import { formatDate, getTripDurationDays } from "@tripboard/shared";
import { Spinner } from "@tripboard/ui";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((r) => r.data);

export function ArchiveGrid() {
  const { data: trips, isLoading } = useSWR<Trip[]>(
    "/api/trips?status=COMPLETED,ARCHIVED",
    fetcher
  );

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  if (!trips?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 p-16 text-center">
        <div className="text-5xl mb-4">🗄️</div>
        <h3 className="font-semibold text-zinc-800 dark:text-zinc-200 text-lg">Archive is empty</h3>
        <p className="mt-2 text-sm text-zinc-500 max-w-sm mx-auto">
          When you complete a trip, it will appear here as a permanent memory capsule.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {trips.map((trip) => (
        <MemoryCapsuleCard key={trip.id} trip={trip} />
      ))}
    </div>
  );
}

function MemoryCapsuleCard({ trip }: { trip: Trip }) {
  const duration =
    trip.startsAt && trip.endsAt
      ? `${getTripDurationDays(trip.startsAt, trip.endsAt)} days`
      : null;

  return (
    <Link href={`/trips/${trip.id}`}>
      <div className="group rounded-2xl border border-zinc-200/60 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-lg transition-all">
        {/* Gradient header */}
        <div className="h-32 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 dark:from-violet-900/40 dark:to-indigo-900/40 flex items-center justify-center">
          <span className="text-5xl opacity-70">🗺️</span>
        </div>

        <div className="p-5">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 text-lg">
            {trip.title}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {trip.primaryDestination}
          </p>
          {trip.startsAt && (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
              {formatDate(trip.startsAt)} {duration ? `· ${duration}` : ""}
            </p>
          )}

          {trip.memoryCapsule && (
            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-1.5">Memory Capsule</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-2">
                {trip.memoryCapsule.summary}
              </p>
              {trip.memoryCapsule.stats && (
                <div className="mt-3 flex gap-4">
                  <div>
                    <p className="text-xs text-zinc-400">{trip.memoryCapsule.stats.journalEntries}</p>
                    <p className="text-xs text-zinc-500">journal entries</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400">{trip.memoryCapsule.stats.totalExpenses} {trip.memoryCapsule.stats.currency}</p>
                    <p className="text-xs text-zinc-500">total spent</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
