"use client";

import useSWR from "swr";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import { useState } from "react";

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((r) => r.data);

interface TripStatsData {
  eventCount: number;
  documentCount: number;
  journalEntryCount: number;
  expenseTotal: number;
  expenseCurrency: string;
  packingTotal: number;
  packingPacked: number;
  startsAt?: string | null;
}

interface TripBudgetData {
  budget: number | null;
  budgetCurrency: string;
}

interface Nudge {
  id: string;
  emoji: string;
  message: string;
  cta?: { label: string; href: string };
  variant: "warning" | "info" | "urgent";
}

function buildNudges(
  tripId: string,
  status: string,
  stats: TripStatsData,
  budget: TripBudgetData | null,
  hasDestination: boolean,
  hasDates: boolean,
  hasMemoryCapsule: boolean,
  startsAt: Date | null,
): Nudge[] {
  const nudges: Nudge[] = [];
  const now = new Date();

  const daysUntil = startsAt
    ? Math.ceil((startsAt.getTime() - now.getTime()) / 86400000)
    : null;

  const dayOfTrip =
    status === "ACTIVE" && startsAt
      ? Math.floor((now.getTime() - startsAt.getTime()) / 86400000) + 1
      : null;

  const packingPct =
    stats.packingTotal > 0
      ? Math.round((stats.packingPacked / stats.packingTotal) * 100)
      : null;

  const isOverBudget =
    budget?.budget && stats.expenseTotal > budget.budget;

  const budgetPct =
    budget?.budget && budget.budget > 0
      ? Math.round((stats.expenseTotal / budget.budget) * 100)
      : null;

  // ── Setup nudges (PLANNING / UPCOMING) ─────────────────────────────────────
  if (["PLANNING", "UPCOMING"].includes(status)) {
    if (!hasDestination) {
      nudges.push({
        id: "no-destination",
        emoji: "📍",
        message: "Add a destination to unlock weather forecasts and AI suggestions.",
        cta: { label: "Edit trip", href: "#edit" },
        variant: "info",
      });
    }

    if (!hasDates) {
      nudges.push({
        id: "no-dates",
        emoji: "📅",
        message: "Set your travel dates to see the countdown and daily agenda.",
        cta: { label: "Edit trip", href: "#edit" },
        variant: "info",
      });
    }

    if (stats.eventCount === 0) {
      nudges.push({
        id: "no-events",
        emoji: "✈️",
        message: "No bookings yet — forward a confirmation email or upload a PDF to auto-extract your itinerary.",
        cta: { label: "Open Vault", href: `/trips/${tripId}/vault` },
        variant: "info",
      });
    }

    if (stats.packingTotal === 0) {
      nudges.push({
        id: "no-packing",
        emoji: "🧳",
        message: "Start your packing list — use a template or let AI generate one for you.",
        cta: { label: "Go to Packing", href: `/trips/${tripId}/packing` },
        variant: "info",
      });
    }

    if (!budget?.budget) {
      nudges.push({
        id: "no-budget",
        emoji: "💳",
        message: "Set a budget to track spending and get alerts when you're close to the limit.",
        cta: { label: "Track expenses", href: `/trips/${tripId}/expenses` },
        variant: "info",
      });
    }

    // Urgency nudges when departure is near
    if (daysUntil !== null && daysUntil <= 7 && daysUntil >= 0) {
      if (packingPct !== null && packingPct < 50) {
        nudges.unshift({
          id: "packing-urgent",
          emoji: "⚠️",
          message: `Trip in ${daysUntil === 0 ? "less than a day" : `${daysUntil} day${daysUntil !== 1 ? "s" : ""}`} — packing is only ${packingPct}% done!`,
          cta: { label: "Finish packing", href: `/trips/${tripId}/packing` },
          variant: "urgent",
        });
      }
      if (stats.documentCount === 0) {
        nudges.unshift({
          id: "no-docs-urgent",
          emoji: "📄",
          message: `Leaving in ${daysUntil} day${daysUntil !== 1 ? "s" : ""} — no documents uploaded yet. Add your tickets now.`,
          cta: { label: "Upload documents", href: `/trips/${tripId}/vault` },
          variant: "urgent",
        });
      }
    }
  }

  // ── Active trip nudges ──────────────────────────────────────────────────────
  if (status === "ACTIVE") {
    if (stats.journalEntryCount === 0) {
      nudges.push({
        id: "no-journal",
        emoji: "📓",
        message: dayOfTrip
          ? `Day ${dayOfTrip} and no journal entries yet — capture today's memories!`
          : "No journal entries yet — write about your trip while it's fresh.",
        cta: { label: "Write first entry", href: `/trips/${tripId}/journal` },
        variant: "info",
      });
    }

    if (isOverBudget && budget?.budget) {
      const over = Math.round(stats.expenseTotal - budget.budget);
      nudges.unshift({
        id: "over-budget",
        emoji: "🚨",
        message: `You're over budget by ${over} ${stats.expenseCurrency}. Review your spending.`,
        cta: { label: "View expenses", href: `/trips/${tripId}/expenses` },
        variant: "urgent",
      });
    } else if (budgetPct !== null && budgetPct >= 80 && budgetPct < 100) {
      nudges.push({
        id: "near-budget",
        emoji: "⚠️",
        message: `You've used ${budgetPct}% of your budget. Keep an eye on spending.`,
        cta: { label: "View expenses", href: `/trips/${tripId}/expenses` },
        variant: "warning",
      });
    }
  }

  // ── Completed trip nudges ───────────────────────────────────────────────────
  if (status === "COMPLETED" && !hasMemoryCapsule) {
    nudges.push({
      id: "memory-capsule",
      emoji: "✨",
      message: "Generate your Memory Capsule — a beautiful summary of this trip to keep forever.",
      cta: { label: "Generate now", href: `/archive` },
      variant: "info",
    });
  }

  // Return top 3 highest-priority nudges
  return nudges.slice(0, 3);
}

const VARIANT_STYLES: Record<string, string> = {
  urgent: "border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/20",
  warning: "border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20",
  info: "border-indigo-100 bg-indigo-50/60 dark:border-indigo-900/40 dark:bg-indigo-950/15",
};

const VARIANT_TEXT: Record<string, string> = {
  urgent: "text-red-800 dark:text-red-300",
  warning: "text-amber-800 dark:text-amber-300",
  info: "text-zinc-700 dark:text-zinc-300",
};

const VARIANT_CTA: Record<string, string> = {
  urgent: "text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200",
  warning: "text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200",
  info: "text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200",
};

interface TripNudgesProps {
  tripId: string;
  status: string;
  hasDestination: boolean;
  hasDates: boolean;
  hasMemoryCapsule: boolean;
  startsAt?: Date | null;
}

export function TripNudges({
  tripId,
  status,
  hasDestination,
  hasDates,
  hasMemoryCapsule,
  startsAt,
}: TripNudgesProps) {
  const { data: stats } = useSWR<TripStatsData>(`/api/trips/${tripId}/stats`, fetcher);
  const { data: budget } = useSWR<TripBudgetData>(`/api/trips/${tripId}/budget`, fetcher);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  if (!stats) return null;

  const startsAtDate = startsAt ? new Date(startsAt) : null;
  const allNudges = buildNudges(
    tripId, status, stats, budget ?? null,
    hasDestination, hasDates, hasMemoryCapsule, startsAtDate,
  );

  const visible = allNudges.filter((n) => !dismissed.has(n.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2">
      {visible.map((nudge) => (
        <div
          key={nudge.id}
          className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${VARIANT_STYLES[nudge.variant]}`}
        >
          <span className="text-lg shrink-0 mt-0.5">{nudge.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className={`text-sm leading-relaxed ${VARIANT_TEXT[nudge.variant]}`}>
              {nudge.message}
            </p>
            {nudge.cta && nudge.cta.href !== "#edit" && (
              <Link
                href={nudge.cta.href}
                className={`inline-flex items-center gap-1 mt-1 text-xs font-semibold transition-colors ${VARIANT_CTA[nudge.variant]}`}
              >
                {nudge.cta.label}
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
          <button
            onClick={() => setDismissed((prev) => new Set([...prev, nudge.id]))}
            className="shrink-0 text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 dark:hover:text-zinc-400 transition-colors mt-0.5"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
