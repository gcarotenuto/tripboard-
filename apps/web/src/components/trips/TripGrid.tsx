"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import type { TripSummary } from "@tripboard/shared";
import { formatDate, getTripDurationDays } from "@tripboard/shared";
import { Spinner } from "@tripboard/ui";

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((r) => r.data);

type StatusFilter = "All" | "Upcoming" | "Active" | "Planning" | "Completed";

const STATUS_FILTERS: StatusFilter[] = ["All", "Upcoming", "Active", "Planning", "Completed"];

export function TripGrid() {
  const [filter, setFilter] = useState<StatusFilter>("All");
  const { data: trips, isLoading, error } = useSWR<TripSummary[]>("/api/trips", fetcher);

  const filtered = !trips ? [] : filter === "All"
    ? trips
    : trips.filter((t) => t.status === filter.toUpperCase());

  return (
    <>
      {/* Filter tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === tab
                ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"
                : "border-zinc-200 bg-white text-zinc-600 hover:border-indigo-300 hover:text-indigo-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-indigo-600 dark:hover:text-indigo-400"
            }`}
          >
            {tab}
            {tab !== "All" && trips && (
              <span className="ml-1.5 text-xs opacity-60">
                {trips.filter((t) => t.status === tab.toUpperCase()).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950/20">
          <p className="text-sm text-red-600 dark:text-red-400">Could not load trips.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 p-12 text-center">
          <div className="text-4xl mb-3">✈️</div>
          <h3 className="font-semibold text-zinc-800 dark:text-zinc-200">
            {filter === "All" ? "No trips yet" : `No ${filter.toLowerCase()} trips`}
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            {filter === "All" ? "Create your first trip to get started." : "Try a different filter."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </>
  );
}

const STATUS_COLORS: Record<string, string> = {
  PLANNING: "bg-zinc-100 text-zinc-600 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700",
  UPCOMING: "bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-800",
  ACTIVE: "bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-800",
  COMPLETED: "bg-indigo-100 text-indigo-700 ring-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:ring-indigo-800",
  ARCHIVED: "bg-zinc-100 text-zinc-500 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-500 dark:ring-zinc-700",
};

function TripCard({ trip }: { trip: TripSummary }) {
  const duration =
    trip.startsAt && trip.endsAt
      ? `${getTripDurationDays(trip.startsAt, trip.endsAt)} days`
      : null;

  const statusLabel = trip.status.charAt(0) + trip.status.slice(1).toLowerCase();

  return (
    <Link href={`/trips/${trip.id}`}>
      <div className="group rounded-2xl border border-zinc-200/60 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-lg transition-all cursor-pointer">
        {/* Cover */}
        <div className="h-28 bg-gradient-to-br from-indigo-500/20 to-violet-500/20 dark:from-indigo-900/40 dark:to-violet-900/40 flex items-center justify-center relative">
          <span className="text-4xl opacity-60">🌍</span>
          {trip.status === "ACTIVE" && (
            <span className="absolute top-2 right-2 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 leading-tight">
              {trip.title}
            </h3>
            <span className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_COLORS[trip.status] ?? STATUS_COLORS.PLANNING}`}>
              {statusLabel}
            </span>
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {trip.primaryDestination ?? "Unknown destination"}
          </p>

          {trip.startsAt && (
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
              {formatDate(trip.startsAt)}{duration ? ` · ${duration}` : ""}
            </p>
          )}

          {trip.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {trip.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
