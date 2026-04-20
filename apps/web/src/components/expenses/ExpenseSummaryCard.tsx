"use client";

import useSWR from "swr";
import type { ExpenseSummary } from "@tripboard/shared";
import { EXPENSE_CATEGORY_COLORS, EXPENSE_CATEGORY_LABELS, formatCurrency } from "@tripboard/shared";

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((r) => r.data);

export function ExpenseSummaryCard({ tripId }: { tripId: string }) {
  const { data: summary } = useSWR<ExpenseSummary>(
    `/api/trips/${tripId}/expenses/summary`,
    fetcher
  );

  if (!summary) return null;

  const categories = Object.entries(summary.byCategory)
    .filter(([, amount]) => amount > 0)
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="rounded-2xl border border-zinc-200/60 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-5">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wide font-medium">Total spent</p>
          <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
            {formatCurrency(summary.totalUsd, "USD")}
          </p>
        </div>
        <p className="text-sm text-zinc-400 dark:text-zinc-500">{summary.expenseCount} items</p>
      </div>

      {/* Category breakdown */}
      <div className="space-y-2">
        {categories.slice(0, 5).map(([category, amount]) => {
          const pct = Math.round((amount / summary.totalUsd) * 100);
          const color = EXPENSE_CATEGORY_COLORS[category as keyof typeof EXPENSE_CATEGORY_COLORS] ?? "#6b7280";
          return (
            <div key={category}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-600 dark:text-zinc-400">
                  {EXPENSE_CATEGORY_LABELS[category as keyof typeof EXPENSE_CATEGORY_LABELS] ?? category}
                </span>
                <span className="text-zinc-500 dark:text-zinc-500">{pct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
