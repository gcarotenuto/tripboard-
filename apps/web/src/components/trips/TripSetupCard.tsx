"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, X } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((r) => r.data);

interface StatsData {
  eventCount: number;
  documentCount: number;
  journalEntryCount: number;
  packingTotal?: number;
  startsAt?: string | null;
}

interface TripSetupCardProps {
  tripId: string;
  tripStatus: string;
  hasDestination: boolean;
  hasDates: boolean;
}

interface ChecklistItem {
  key: string;
  label: string;
  hint: string;
  done: boolean;
  href: string;
}

export function TripSetupCard({ tripId, tripStatus, hasDestination, hasDates }: TripSetupCardProps) {
  const { data: stats } = useSWR<StatsData>(`/api/trips/${tripId}/stats`, fetcher);
  const [dismissed, setDismissed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Only show for PLANNING and UPCOMING trips with incomplete setup
  if (dismissed) return null;
  if (!["PLANNING", "UPCOMING"].includes(tripStatus)) return null;
  if (!stats) return null; // wait for data

  const checks: ChecklistItem[] = [
    {
      key: "destination",
      label: "Set a destination",
      hint: "Tap ✏️ Edit above to add where you're heading",
      done: hasDestination,
      href: ``,
    },
    {
      key: "dates",
      label: "Add travel dates",
      hint: "Tap ✏️ Edit above to set start and end dates",
      done: hasDates,
      href: ``,
    },
    {
      key: "events",
      label: "Add a booking or event",
      hint: "Upload a confirmation or add manually",
      done: stats.eventCount > 0,
      href: `/trips/${tripId}/timeline`,
    },
    {
      key: "documents",
      label: "Upload a document",
      hint: "Flight ticket, hotel voucher, etc.",
      done: stats.documentCount > 0,
      href: `/trips/${tripId}/vault`,
    },
    {
      key: "packing",
      label: "Start your packing list",
      hint: "Never forget essentials again",
      done: (stats.packingTotal ?? 0) > 0,
      href: `/trips/${tripId}/packing`,
    },
  ];

  const doneCount = checks.filter((c) => c.done).length;
  const totalCount = checks.length;
  const pct = Math.round((doneCount / totalCount) * 100);
  const allDone = doneCount === totalCount;

  // Hide once fully complete
  if (allDone) return null;

  return (
    <div className="mb-8 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-50/60 to-violet-50/60 dark:from-indigo-950/20 dark:to-violet-950/20 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm font-bold text-indigo-900 dark:text-indigo-200">
              {doneCount === 0 ? "Set up your trip" : `Almost ready — ${totalCount - doneCount} step${totalCount - doneCount !== 1 ? "s" : ""} left`}
            </p>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/40 rounded-full px-2 py-0.5">
              {doneCount}/{totalCount}
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="p-1.5 rounded-lg text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 rounded-lg text-indigo-300 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
            title="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Checklist */}
      {!collapsed && (
        <div className="px-5 pb-5 space-y-1.5">
          {checks.map((item) => (
            <div
              key={item.key}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                item.done
                  ? "bg-white/40 dark:bg-zinc-900/20"
                  : "bg-white/70 dark:bg-zinc-900/40 hover:bg-white dark:hover:bg-zinc-900/60"
              }`}
            >
              {item.done ? (
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              ) : (
                <Circle size={16} className="text-indigo-200 dark:text-indigo-800 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${item.done ? "text-zinc-400 dark:text-zinc-600 line-through" : "text-zinc-800 dark:text-zinc-200"}`}>
                  {item.label}
                </p>
                {!item.done && (
                  <p className="text-xs text-zinc-400 dark:text-zinc-600">{item.hint}</p>
                )}
              </div>
              {!item.done && item.href && (
                <Link
                  href={item.href}
                  className="shrink-0 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 transition-colors"
                >
                  Go →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
