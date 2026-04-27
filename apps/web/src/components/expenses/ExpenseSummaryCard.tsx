"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import type { ExpenseSummary, ExpenseCategory } from "@tripboard/shared";
import { EXPENSE_CATEGORY_COLORS, EXPENSE_CATEGORY_LABELS, formatCurrency } from "@tripboard/shared";
import { Target, Pencil, Check, X } from "lucide-react";

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

function BudgetTracker({ tripId, totalUsd }: { tripId: string; totalUsd: number }) {
  const { data: budget, mutate } = useSWR<{ budget: number | null; budgetCurrency: string }>(
    `/api/trips/${tripId}/budget`,
    fetcher
  );
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState("");
  const [saving, setSaving] = useState(false);

  if (!budget) return null;

  const save = async () => {
    setSaving(true);
    const parsed = parseFloat(val);
    try {
      await fetch(`/api/trips/${tripId}/budget`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budget: isNaN(parsed) ? null : parsed, budgetCurrency: "USD" }),
      });
      await mutate();
      setEditing(false);
    } catch {
      // Budget save failed silently — user can retry
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <p className="text-[10px] uppercase tracking-wide font-medium text-zinc-400 dark:text-zinc-500 mb-2 flex items-center gap-1">
          <Target className="h-3 w-3" /> Budget (USD)
        </p>
        <div className="flex items-center gap-2">
          <input
            autoFocus
            type="number"
            placeholder="e.g. 3000"
            defaultValue={budget.budget ?? ""}
            onChange={(e) => setVal(e.target.value)}
            className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button onClick={save} disabled={saving} className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
            <Check className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  if (!budget.budget) {
    return (
      <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <button
          onClick={() => { setVal(""); setEditing(true); }}
          className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <Target className="h-3.5 w-3.5" />
          Set a budget
        </button>
      </div>
    );
  }

  const pct = Math.min((totalUsd / budget.budget) * 100, 100);
  const over = totalUsd > budget.budget;

  return (
    <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] uppercase tracking-wide font-medium text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
          <Target className="h-3 w-3" /> Budget
        </p>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold ${over ? "text-red-600 dark:text-red-400" : "text-zinc-700 dark:text-zinc-300"}`}>
            {formatCurrency(totalUsd, "USD")} / {formatCurrency(budget.budget, "USD")}
          </span>
          <button onClick={() => { setVal(String(budget.budget ?? "")); setEditing(true); }} className="p-0.5 text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 dark:hover:text-zinc-400 transition-colors">
            <Pencil className="h-3 w-3" />
          </button>
        </div>
      </div>
      <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${over ? "bg-red-500" : pct > 80 ? "bg-amber-500" : "bg-emerald-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className={`mt-1 text-[10px] ${over ? "text-red-500 dark:text-red-400" : "text-zinc-400 dark:text-zinc-500"}`}>
        {over
          ? `Over budget by ${formatCurrency(totalUsd - budget.budget, "USD")}`
          : `${formatCurrency(budget.budget - totalUsd, "USD")} remaining (${Math.round(100 - pct)}%)`
        }
      </p>
    </div>
  );
}

export function ExpenseSummaryCard({ tripId }: { tripId: string }) {
  const { data: summary } = useSWR<ExpenseSummary>(
    `/api/trips/${tripId}/expenses/summary`,
    fetcher
  );
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    if (summary) {
      // Stagger: let paint happen first, then animate bars
      const t = setTimeout(() => setAnimated(true), 80);
      return () => clearTimeout(t);
    }
  }, [summary]);

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
                strokeDasharray={animated ? arc.dasharray : "0 100"}
                strokeDashoffset={animated ? arc.dashoffset : 100}
                strokeLinecap="butt"
                style={{ transition: `stroke-dasharray 0.6s ease ${i * 100 + 200}ms, stroke-dashoffset 0.6s ease ${i * 100 + 200}ms` }}
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
      <div className="space-y-2.5">
        {categories.slice(0, 6).map(([category, amount], idx) => {
          const pct = Math.round((amount / summary.totalUsd) * 100);
          const color = EXPENSE_CATEGORY_COLORS[category] ?? "#6b7280";
          return (
            <div key={category} style={{ transitionDelay: `${idx * 60}ms` }}>
              <div className="flex justify-between text-xs mb-1">
                <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  {EXPENSE_CATEGORY_LABELS[category] ?? category}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-400 dark:text-zinc-500 text-[11px]">{pct}%</span>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    {formatCurrency(amount, "USD")}
                  </span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: animated ? `${pct}%` : "0%",
                    backgroundColor: color,
                    transition: `width 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${idx * 60}ms`,
                  }}
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

      {/* Budget tracker */}
      <BudgetTracker tripId={tripId} totalUsd={summary.totalUsd} />
    </div>
  );
}
