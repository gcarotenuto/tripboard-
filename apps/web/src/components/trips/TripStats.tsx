"use client";

import { useEffect, useRef, useState } from "react";
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

/** Animates a number from 0 to target over ~600ms */
function useCountUp(target: number | null, duration = 600): number | null {
  const [value, setValue] = useState<number | null>(null);
  const raf = useRef<number>(0);

  useEffect(() => {
    if (target === null) return;
    const start = performance.now();
    const from = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return value;
}

function StatCard({
  emoji,
  label,
  value,
  sub,
  delay = 0,
}: {
  emoji: string;
  label: string;
  value: number | string | null;
  sub?: string | null;
  delay?: number;
}) {
  const numericTarget = typeof value === "number" ? value : null;
  const animated = useCountUp(numericTarget);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const display = numericTarget !== null ? (animated ?? "—") : (value ?? "—");

  return (
    <div
      ref={ref}
      className={`
        rounded-xl border border-zinc-200/60 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-3
        transition-all duration-500
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
      `}
    >
      <div className="text-xl mb-1">{emoji}</div>
      <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-none tabular-nums">
        {display}
      </div>
      <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">{label}</div>
      {sub && (
        <div className="text-[11px] text-indigo-500 dark:text-indigo-400 mt-1 font-medium">{sub}</div>
      )}
    </div>
  );
}

export function TripStats({ tripId }: { tripId: string }) {
  const { data } = useSWR<TripStatsData>(`/api/trips/${tripId}/stats`, fetcher);

  const daysUntil = data ? getDaysUntil(data.startsAt) : null;
  const extractedDocs = data?.extractedDocumentCount ?? null;
  const totalDocs = data?.documentCount ?? 0;

  return (
    <div className="space-y-3">
      {/* Countdown banner */}
      {daysUntil !== null && daysUntil > 0 && daysUntil <= 30 && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 px-4 py-2.5 flex items-center gap-3 animate-[fadeIn_0.4s_ease-out]">
          <span className="text-lg shrink-0">⏳</span>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            {daysUntil === 1 ? "Trip starts tomorrow! 🎉" : `${daysUntil} days until departure`}
          </p>
          <div className="ml-auto flex-shrink-0">
            <div className="h-1.5 w-24 rounded-full bg-amber-200 dark:bg-amber-900 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-1000"
                style={{ width: `${Math.min(100, (1 - daysUntil / 30) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard emoji="📅" label="Events"       value={data?.eventCount ?? null}        delay={0}   />
        <StatCard emoji="🗄️" label="Documents"   value={data?.documentCount ?? null}     delay={60}
          sub={extractedDocs !== null && totalDocs > 0 ? `${extractedDocs}/${totalDocs} extracted` : null} />
        <StatCard emoji="📓" label="Journal"      value={data?.journalEntryCount ?? null} delay={120} />
        <StatCard emoji="💳" label="Total spend"
          value={data?.expenseTotal ? `${data.expenseTotal} ${data.expenseCurrency}` : null}
          delay={180} />
      </div>
    </div>
  );
}
