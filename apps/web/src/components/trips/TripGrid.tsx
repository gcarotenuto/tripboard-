"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import type { TripSummary } from "@tripboard/shared";
import { formatDate, getTripDurationDays } from "@tripboard/shared";
import { Spinner } from "@tripboard/ui";
import { MapPin, Calendar, Tag } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((r) => r.data);

type StatusFilter = "All" | "Upcoming" | "Active" | "Planning" | "Completed";
const STATUS_FILTERS: StatusFilter[] = ["All", "Upcoming", "Active", "Planning", "Completed"];

/** Deterministic gradient based on destination string */
function getCardGradient(dest: string | null, status: string): string {
  const d = (dest ?? "").toLowerCase();
  if (status === "ACTIVE") return "from-emerald-400/30 via-teal-400/20 to-cyan-400/15";
  if (d.includes("japan") || d.includes("tokyo") || d.includes("kyoto") || d.includes("osaka"))
    return "from-rose-400/30 via-pink-400/20 to-fuchsia-400/15";
  if (d.includes("morocco") || d.includes("marrakech") || d.includes("sahara"))
    return "from-orange-400/35 via-amber-400/25 to-yellow-400/15";
  if (d.includes("new york") || d.includes("usa") || d.includes("manhattan"))
    return "from-sky-400/30 via-blue-400/20 to-indigo-400/15";
  if (d.includes("lisbon") || d.includes("portugal") || d.includes("porto"))
    return "from-yellow-400/30 via-amber-400/20 to-orange-300/15";
  if (d.includes("rome") || d.includes("italy") || d.includes("amalfi") || d.includes("napoli"))
    return "from-amber-400/30 via-yellow-400/20 to-lime-400/15";
  if (d.includes("paris") || d.includes("france"))
    return "from-violet-400/30 via-purple-400/20 to-fuchsia-400/15";
  if (status === "UPCOMING") return "from-amber-400/30 via-orange-400/20 to-yellow-400/15";
  if (status === "COMPLETED") return "from-indigo-400/30 via-violet-400/20 to-purple-400/15";
  return "from-zinc-300/40 via-slate-300/25 to-zinc-200/15";
}

function getStatusConfig(status: string) {
  const configs: Record<string, { label: string; dot: string; badge: string }> = {
    PLANNING: {
      label: "Planning",
      dot: "bg-zinc-400",
      badge: "bg-zinc-100 text-zinc-600 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700",
    },
    UPCOMING: {
      label: "Upcoming",
      dot: "bg-amber-400",
      badge: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-800",
    },
    ACTIVE: {
      label: "Active",
      dot: "bg-emerald-400 animate-ping",
      badge: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-800",
    },
    COMPLETED: {
      label: "Completed",
      dot: "bg-indigo-400",
      badge: "bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:ring-indigo-800",
    },
    ARCHIVED: {
      label: "Archived",
      dot: "bg-zinc-300",
      badge: "bg-zinc-100 text-zinc-500 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-500 dark:ring-zinc-700",
    },
  };
  return configs[status] ?? configs.PLANNING;
}

export function TripGrid() {
  const [filter, setFilter] = useState<StatusFilter>("All");
  const { data: trips, isLoading, error } = useSWR<TripSummary[]>("/api/trips", fetcher);

  const filtered = !trips
    ? []
    : filter === "All"
    ? trips
    : trips.filter((t) => t.status === filter.toUpperCase());

  return (
    <>
      {/* Filter tabs */}
      <div className="mb-6 flex gap-1.5 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((tab) => {
          const count = tab !== "All" && trips
            ? trips.filter((t) => t.status === tab.toUpperCase()).length
            : null;
          return (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                filter === tab
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
              }`}
            >
              {tab}
              {count !== null && count > 0 && (
                <span className={`ml-1.5 text-xs ${filter === tab ? "opacity-70" : "opacity-50"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center dark:border-red-900 dark:bg-red-950/20">
          <p className="text-sm text-red-600 dark:text-red-400">Could not load trips. Please refresh.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 p-16 text-center">
          <div className="text-5xl mb-4">✈️</div>
          <h3 className="font-semibold text-zinc-800 dark:text-zinc-200 text-lg">
            {filter === "All" ? "No trips yet" : `No ${filter.toLowerCase()} trips`}
          </h3>
          <p className="mt-2 text-sm text-zinc-400">
            {filter === "All" ? "Create your first trip to get started." : "Try a different filter."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((trip) => <TripCard key={trip.id} trip={trip} />)}
        </div>
      )}
    </>
  );
}

function TripCard({ trip }: { trip: TripSummary }) {
  const duration =
    trip.startsAt && trip.endsAt
      ? getTripDurationDays(trip.startsAt, trip.endsAt)
      : null;

  const gradient = getCardGradient(trip.primaryDestination, trip.status);
  const statusCfg = getStatusConfig(trip.status);

  // Short ghost text from primary destination
  const ghostText = trip.primaryDestination?.split(",")[0]?.toUpperCase() ?? "";

  return (
    <Link href={`/trips/${trip.id}`}>
      <article className="group relative rounded-2xl border border-zinc-200/70 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden hover:shadow-xl hover:shadow-zinc-900/8 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">

        {/* Card header */}
        <div className={`relative h-36 bg-gradient-to-br ${gradient} overflow-hidden`}>
          {/* Ghost destination text */}
          <span className="absolute inset-0 flex items-center justify-center text-[4rem] font-black tracking-tighter text-zinc-900/[0.06] dark:text-zinc-100/[0.06] select-none overflow-hidden leading-none px-3 text-center">
            {ghostText}
          </span>

          {/* Status indicator */}
          <div className="absolute top-3 left-3">
            {trip.status === "ACTIVE" ? (
              <div className="flex items-center gap-1.5 rounded-full bg-white/90 dark:bg-zinc-900/90 px-2.5 py-1 backdrop-blur-sm shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">Live</span>
              </div>
            ) : (
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm shadow-sm ${statusCfg.badge}`}>
                {statusCfg.label}
              </span>
            )}
          </div>
        </div>

        {/* Card body */}
        <div className="p-4">
          <h3 className="font-semibold text-[15px] text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors leading-tight mb-2">
            {trip.title}
          </h3>

          <div className="space-y-1">
            {trip.primaryDestination && (
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                <MapPin className="h-3 w-3 shrink-0 text-zinc-400" />
                {trip.primaryDestination}
              </div>
            )}
            {trip.startsAt && (
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
                <Calendar className="h-3 w-3 shrink-0" />
                {formatDate(trip.startsAt)}
                {duration ? ` · ${duration} days` : ""}
              </div>
            )}
          </div>

          {trip.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {trip.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
