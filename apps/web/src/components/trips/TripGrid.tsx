"use client";

import { useState, useRef, useCallback } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { TripSummary } from "@tripboard/shared";
import { formatDate, getTripDurationDays } from "@tripboard/shared";
import { MapPin, Calendar, Wand2 } from "lucide-react";
import { CoverUpload } from "@/components/trips/CoverUpload";

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
  const [demoLoading, setDemoLoading] = useState(false);
  const { data: trips, isLoading, error, mutate } = useSWR<TripSummary[]>("/api/trips", fetcher);
  const router = useRouter();

  const handleDemo = async () => {
    setDemoLoading(true);
    try {
      const res = await fetch("/api/trips/demo", { method: "POST" });
      const body = await res.json();
      if (res.ok && body.data?.id) {
        await mutate();
        router.push(`/trips/${body.data.id}`);
      }
    } finally {
      setDemoLoading(false);
    }
  };

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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-zinc-200/70 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden animate-pulse">
              <div className="h-36 bg-zinc-100 dark:bg-zinc-800" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-3/4" />
                <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-1/2" />
                <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center dark:border-red-900 dark:bg-red-950/20">
          <p className="text-sm text-red-600 dark:text-red-400">Could not load trips. Please refresh.</p>
        </div>
      ) : filtered.length === 0 ? (
        filter !== "All" ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-12 text-center">
            <div className="text-3xl mb-3">🔍</div>
            <p className="font-medium text-zinc-700 dark:text-zinc-300">No {filter.toLowerCase()} trips</p>
            <button onClick={() => setFilter("All")} className="mt-3 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">View all trips</button>
          </div>
        ) : (
          /* First-time user: rich onboarding state */
          <div className="rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 overflow-hidden">
            {/* Hero */}
            <div className="bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50 dark:from-indigo-950/20 dark:via-violet-950/20 dark:to-purple-950/20 px-8 pt-12 pb-8 text-center">
              <div className="text-6xl mb-4 animate-float inline-block">✈️</div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Plan your first adventure</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                TripBoard keeps all your bookings, documents, expenses and memories in one place.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                <button
                  onClick={handleDemo}
                  disabled={demoLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors disabled:opacity-60 shadow-sm"
                >
                  {demoLoading
                    ? <><span className="h-4 w-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />Creating…</>
                    : <><Wand2 className="h-4 w-4" />Explore a sample trip</>
                  }
                </button>
              </div>
            </div>
            {/* Steps */}
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-zinc-100 dark:divide-zinc-800/60 bg-white dark:bg-zinc-900/60">
              {[
                { emoji: "📅", title: "Plan your trip", desc: "Add destination, dates and status — it takes 30 seconds." },
                { emoji: "📄", title: "Import bookings", desc: "Forward confirmation emails or upload PDFs — we extract everything." },
                { emoji: "💳", title: "Track spending", desc: "Log expenses on the go. See totals and breakdowns instantly." },
              ].map((step) => (
                <div key={step.title} className="px-6 py-5 text-center">
                  <div className="text-2xl mb-2">{step.emoji}</div>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-1">{step.title}</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((trip, i) => <TripCard key={trip.id} trip={trip} index={i} />)}
        </div>
      )}
    </>
  );
}

function TripCard({ trip, index }: { trip: TripSummary; index: number }) {
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(trip.coverImageUrl ?? null);
  const cardRef = useRef<HTMLElement>(null);

  const duration =
    trip.startsAt && trip.endsAt
      ? getTripDurationDays(trip.startsAt, trip.endsAt)
      : null;

  const gradient = getCardGradient(trip.primaryDestination, trip.status);
  const statusCfg = getStatusConfig(trip.status);
  const ghostText = trip.primaryDestination?.split(",")[0]?.toUpperCase() ?? "";

  // Countdown for upcoming trips
  const upcomingCountdown = (() => {
    if (trip.status !== "UPCOMING" || !trip.startsAt) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(trip.startsAt);
    start.setHours(0, 0, 0, 0);
    const days = Math.ceil((start.getTime() - today.getTime()) / 86400000);
    if (days < 0) return null;
    if (days === 0) return { label: "Today! ✈️", urgent: true };
    if (days === 1) return { label: "Tomorrow ✈️", urgent: true };
    if (days <= 7) return { label: `✈️ ${days}d`, urgent: true };
    if (days <= 30) return { label: `✈️ ${days}d`, urgent: false };
    return null;
  })();

  // "Day X of Y" for active trips (client-side, runs on render)
  const activeDayInfo = (() => {
    if (trip.status !== "ACTIVE" || !trip.startsAt) return null;
    const start = new Date(trip.startsAt);
    start.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayNumber = Math.floor((today.getTime() - start.getTime()) / 86400000) + 1;
    if (dayNumber < 1) return null;
    const totalDays = trip.endsAt
      ? Math.floor((new Date(trip.endsAt).getTime() - start.getTime()) / 86400000) + 1
      : null;
    return { dayNumber, totalDays };
  })();

  // 3D tilt effect
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const { left, top, width, height } = card.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;   // -0.5 to 0.5
    const y = (e.clientY - top) / height - 0.5;
    card.style.transform = `perspective(700px) rotateX(${-y * 7}deg) rotateY(${x * 7}deg) translateZ(4px)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (cardRef.current) {
      cardRef.current.style.transform = "";
    }
  }, []);

  // Staggered entry: cap at 6 so later cards don't wait forever
  const delay = Math.min(index, 5) * 70;

  return (
    <Link href={`/trips/${trip.id}`}>
      <article
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ animationDelay: `${delay}ms` }}
        className="trip-card-3d card-enter group relative rounded-2xl border border-zinc-200/70 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden cursor-pointer"
      >

        {/* Card header */}
        <div
          className={`relative h-36 overflow-hidden transition-all duration-300 ${
            coverImageUrl ? "" : `bg-gradient-to-br ${gradient}`
          } ${trip.status === "ACTIVE" ? "animate-gradient-drift" : ""}`}
          style={
            coverImageUrl
              ? { backgroundImage: `url(${coverImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
              : trip.status === "ACTIVE"
              ? { backgroundImage: "linear-gradient(135deg, #10b981 0%, #0d9488 40%, #06b6d4 100%)", backgroundSize: "200% 200%" }
              : undefined
          }
        >
          {/* Ghost destination text — only when no cover image */}
          {!coverImageUrl && (
            <span className="absolute inset-0 flex items-center justify-center text-[4rem] font-black tracking-tighter text-zinc-900/[0.06] dark:text-white/[0.07] select-none overflow-hidden leading-none px-3 text-center">
              {ghostText}
            </span>
          )}

          {/* Shimmer on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none overflow-hidden rounded-t-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
          </div>

          {/* Status indicator */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            {trip.status === "ACTIVE" ? (
              <>
                <div className="flex items-center gap-1.5 rounded-full bg-white/90 dark:bg-zinc-900/90 px-2.5 py-1 backdrop-blur-sm shadow-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">Live</span>
                </div>
                {activeDayInfo && (
                  <div className="rounded-full bg-emerald-600/90 px-2 py-1 backdrop-blur-sm shadow-sm">
                    <span className="text-[11px] font-bold text-white">
                      Day {activeDayInfo.dayNumber}{activeDayInfo.totalDays ? `/${activeDayInfo.totalDays}` : ""}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm shadow-sm ${statusCfg.badge}`}>
                  {statusCfg.label}
                </span>
                {upcomingCountdown && (
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold backdrop-blur-sm shadow-sm ${
                    upcomingCountdown.urgent
                      ? "bg-amber-500/90 text-white"
                      : "bg-white/80 dark:bg-zinc-900/80 text-amber-700 dark:text-amber-400"
                  }`}>
                    {upcomingCountdown.label}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Cover upload button — visible on group hover */}
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <CoverUpload
              tripId={trip.id}
              currentUrl={coverImageUrl}
              onUpload={(url) => setCoverImageUrl(url)}
            />
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
