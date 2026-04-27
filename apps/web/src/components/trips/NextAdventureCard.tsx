"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import type { TripSummary } from "@tripboard/shared";
import { ArrowRight, Plane, MapPin } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((r) => r.data);

function useLiveCountdown(targetDate: Date | null) {
  const [diff, setDiff] = useState(() =>
    targetDate ? Math.max(0, targetDate.getTime() - Date.now()) : 0
  );

  useEffect(() => {
    if (!targetDate) return;
    const tick = () => setDiff(Math.max(0, targetDate.getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, totalSeconds };
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center min-w-[40px]">
      <div className="text-2xl sm:text-3xl font-black tabular-nums text-white leading-none">
        {String(value).padStart(2, "0")}
      </div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-white/60 mt-0.5">
        {label}
      </div>
    </div>
  );
}

function Divider() {
  return <div className="text-xl font-bold text-white/40 pb-3">:</div>;
}

export function NextAdventureCard() {
  const { data: trips } = useSWR<TripSummary[]>("/api/trips", fetcher);

  // Priority: ACTIVE first, then soonest UPCOMING
  const featured = (() => {
    if (!trips?.length) return null;
    const active = trips.find((t) => t.status === "ACTIVE");
    if (active) return { trip: active, isActive: true };
    const upcoming = trips
      .filter((t) => t.status === "UPCOMING" && t.startsAt)
      .sort((a, b) => new Date(a.startsAt!).getTime() - new Date(b.startsAt!).getTime());
    if (upcoming[0]) return { trip: upcoming[0], isActive: false };
    return null;
  })();

  const targetDate = (() => {
    if (!featured) return null;
    if (featured.isActive) return null; // active trips don't need countdown
    return featured.trip.startsAt ? new Date(featured.trip.startsAt) : null;
  })();

  const { days, hours, minutes, seconds, totalSeconds } = useLiveCountdown(targetDate);

  if (!featured) return null;

  const { trip, isActive } = featured;
  const daysLeft = Math.ceil((new Date(trip.startsAt!).getTime() - Date.now()) / 86400000);

  // Active trip day counter
  const activeDayInfo = (() => {
    if (!isActive || !trip.startsAt) return null;
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

  const isImminentDeparture = !isActive && targetDate && totalSeconds > 0 && daysLeft <= 3;
  const isTomorrow = !isActive && daysLeft === 1;
  const isToday = !isActive && daysLeft === 0;

  // Gradient by destination
  const dest = (trip.primaryDestination ?? "").toLowerCase();
  const gradient = (() => {
    if (isActive) return "from-emerald-600 via-teal-600 to-cyan-600";
    if (dest.includes("japan") || dest.includes("tokyo")) return "from-rose-600 via-pink-600 to-fuchsia-600";
    if (dest.includes("morocco") || dest.includes("marrakech")) return "from-orange-600 via-amber-600 to-yellow-500";
    if (dest.includes("new york") || dest.includes("usa")) return "from-sky-600 via-blue-600 to-indigo-600";
    if (dest.includes("paris") || dest.includes("france")) return "from-violet-600 via-purple-600 to-fuchsia-600";
    if (dest.includes("italy") || dest.includes("rome") || dest.includes("amalfi")) return "from-amber-600 via-yellow-500 to-lime-600";
    return "from-indigo-600 via-violet-600 to-purple-600";
  })();

  return (
    <Link href={`/trips/${trip.id}`}>
      <div
        className={`relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r ${gradient} p-5 sm:p-6 cursor-pointer group shadow-lg shadow-black/10`}
        style={{ backgroundSize: "200% 200%", animation: "gradientDrift 8s ease infinite" }}
      >
        {/* Ambient glow blob */}
        <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -left-4 h-24 w-32 rounded-full bg-white/5 blur-2xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Left: labels */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              {isActive ? (
                <div className="flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-0.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                  </span>
                  <span className="text-[11px] font-bold text-white">LIVE</span>
                </div>
              ) : isToday ? (
                <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold text-white">
                  DEPARTING TODAY ✈️
                </span>
              ) : isTomorrow ? (
                <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold text-white">
                  DEPARTING TOMORROW ✈️
                </span>
              ) : (
                <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold text-white">
                  NEXT ADVENTURE
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight truncate">
              {trip.title}
            </h2>

            {trip.primaryDestination && (
              <div className="flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3 text-white/70 shrink-0" />
                <p className="text-sm text-white/80 truncate">{trip.primaryDestination}</p>
              </div>
            )}

            {isActive && activeDayInfo && (
              <p className="mt-2 text-sm text-white/90 font-medium">
                Day {activeDayInfo.dayNumber}{activeDayInfo.totalDays ? ` of ${activeDayInfo.totalDays}` : ""} — enjoy every moment 🌟
              </p>
            )}
          </div>

          {/* Right: countdown (upcoming only) or day counter (active) */}
          {!isActive && targetDate && totalSeconds > 0 && (
            <div className="flex items-end gap-1.5 bg-white/10 rounded-2xl px-4 py-3 backdrop-blur-sm border border-white/20">
              {days > 0 && (
                <>
                  <CountdownUnit value={days} label={days === 1 ? "day" : "days"} />
                  {(hours > 0 || minutes > 0) && <Divider />}
                </>
              )}
              {(days === 0 || days <= 2) && (
                <>
                  <CountdownUnit value={hours} label="hrs" />
                  <Divider />
                  <CountdownUnit value={minutes} label="min" />
                </>
              )}
              {days === 0 && (
                <>
                  <Divider />
                  <CountdownUnit value={seconds} label="sec" />
                </>
              )}
            </div>
          )}

          {isActive && activeDayInfo && (
            <div className="flex flex-col items-center bg-white/10 rounded-2xl px-5 py-3 backdrop-blur-sm border border-white/20">
              <div className="text-3xl font-black text-white tabular-nums">{activeDayInfo.dayNumber}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-white/60">
                {activeDayInfo.totalDays ? `of ${activeDayInfo.totalDays} days` : "day"}
              </div>
            </div>
          )}

          {/* Arrow */}
          <ArrowRight className="h-5 w-5 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0 hidden sm:block" />
        </div>

        {/* Shimmer on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
        </div>
      </div>
    </Link>
  );
}
