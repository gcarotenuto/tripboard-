"use client";

import useSWR from "swr";
import type { ExpenseSummary, ExpenseCategory } from "@tripboard/shared";
import { EXPENSE_CATEGORY_COLORS, EXPENSE_CATEGORY_LABELS, formatCurrency } from "@tripboard/shared";

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((r) => r.data);

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", JPY: "¥", CAD: "CA$", AUD: "A$",
  CHF: "Fr", CNY: "¥", INR: "₹", BRL: "R$", MXN: "MX$", SGD: "S$",
  HKD: "HK$", NOK: "kr", SEK: "kr", DKK: "kr", PLN: "zł", CZK: "Kč",
  HUF: "Ft", RON: "lei",
};

function formatOriginal(currency: string, amount: number): string {
  const sym = CURRENCY_SYMBOLS[currency] ?? currency;
  const formatted = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount);
  return `${sym}\u00a0${formatted}`;
}

// Build SVG donut arcs from category slices
function buildArcs(slices: { pct: number; color: string }[]): { dasharray: string; dashoffset: number; color: string }[] {
  // SVG circle circumference for r=15.9155 (standard donut): 2π·15.9155 ≈ 100
  const CIRC = 100;
  const result: { dasharray: string; dashoffset: number; color: string }[] = [];
  let offset = 0; // start at top (we rotate -90deg via CSS)
  for (const slice of slices) {
    const dash = (slice.pct / 100) * CIRC;
    result.push({
      dasharray: `${dash} ${CIRC - dash}`,
      dashoffset: CIRC - offset,
      color: slice.color,
    });
    offset += dash;
  }
  return result;
}

export function ExpenseSummaryCard({ tripId }: { tripId: string }) {
  const { data: summary } = useSWR<ExpenseSummary>(
    `/api/trips/${tripId}/expenses/summary`,
    fetcher
  );

  if (!summary) return null;

  const categories = Object.entries(summary.byCategory)
    .filter(([, amount]) => amount > 0)
    .sort(([, a], [, b]) => b - a) as [ExpenseCategory, number][];

  const slices = categories.map(([cat, amount]) => ({
    pct: summary.totalUsd > 0 ? (amount / summary.totalUsd) * 100 : 0,
    color: EXPENSE_CATEGORY_COLORS[cat] ?? "#6b7280",
    category: cat,
  }));

  const arcs = buildArcs(slices);

  const currencyEntries = Object.entries(summary.totalByCurrency).filter(([, v]) => v > 0);
  const paidCount = summary.paidCount ?? 0;
  const unpaidCount = summary.unpaidCount ?? 0;

  return (
    <div className="rounded-2xl border border-zinc-200/60 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-5">
      {/* Donut chart + total */}
      <div className="flex flex-col items-center mb-5">
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            {/* Background track */}
            <circle
              cx="18" cy="18" r="15.9155"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-zinc-100 dark:text-zinc-800"
              strokeDasharray="100 0"
              strokeDashoffset="0"
            />
            {arcs.map((arc, i) => (
              <circle
                key={i}
                cx="18" cy="18" r="15.9155"
                fill="none"
                stroke={arc.color}
                strokeWidth="3"
                strokeDasharray={arc.dasharray}
                strokeDashoffset={arc.dashoffset}
                strokeLinecap="butt"
              />
            ))}
          </svg>
          {/* Center total */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wide leading-none mb-0.5">Total</p>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-none">
              {formatCurrency(summary.totalUsd, "USD")}
            </p>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">{summary.expenseCount} items</p>
          </div>
        </div>

        {/* Paid/Unpaid badge */}
        <div className="flex items-center gap-2 mt-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            {paidCount} paid
          </span>
          {unpaidCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2.5 py-0.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 inline-block" />
              {unpaidCount} unpaid
            </span>
          )}
        </div>
      </div>

      {/* Category legend + bars */}
      <div className="space-y-2">
        {categories.slice(0, 5).map(([category, amount]) => {
          const pct = Math.round((amount / summary.totalUsd) * 100);
          const color = EXPENSE_CATEGORY_COLORS[category] ?? "#6b7280";
          return (
            <div key={category}>
              <div className="flex justify-between text-xs mb-1">
                <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  {EXPENSE_CATEGORY_LABELS[category] ?? category}
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

      {/* Totals by currency */}
      {currencyEntries.length > 1 && (
        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <p className="text-[10px] uppercase tracking-wide font-medium text-zinc-400 dark:text-zinc-500 mb-2">By currency</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {currencyEntries.map(([currency, amount]) => (
              <span key={currency} className="text-xs text-zinc-600 dark:text-zinc-400">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {formatOriginal(currency, amount)}
                </span>
                {" "}
                <span className="text-zinc-400 dark:text-zinc-500">{currency}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
