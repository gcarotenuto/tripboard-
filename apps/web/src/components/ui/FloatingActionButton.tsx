"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { mutate } from "swr";
import { Plus, X, CreditCard, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

const CURRENCIES = ["EUR", "USD", "GBP", "JPY", "CHF", "CAD", "AUD"] as const;
const EXPENSE_CATEGORIES = [
  { value: "TRANSPORT",     label: "🚗 Transport" },
  { value: "ACCOMMODATION", label: "🏨 Hotel" },
  { value: "FOOD",          label: "🍽️ Food" },
  { value: "ACTIVITY",      label: "🎯 Activity" },
  { value: "SHOPPING",      label: "🛍️ Shopping" },
  { value: "OTHER",         label: "📦 Other" },
];

interface QuickForm {
  title: string;
  amount: string;
  currency: string;
  category: string;
}

function QuickExpenseSheet({ tripId, onClose }: { tripId: string; onClose: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState<QuickForm>({ title: "", amount: "", currency: "EUR", category: "FOOD" });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.amount) return;
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      toast("Enter a valid amount", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          amount,
          currency: form.currency,
          category: form.category,
          date: new Date().toISOString(),
          isPaid: true,
        }),
      });
      if (res.ok) {
        await mutate(`/api/trips/${tripId}/expenses`);
        await mutate(`/api/trips/${tripId}/expenses/summary`);
        await mutate(`/api/trips/${tripId}/stats`);
        toast("Expense added ✓");
        onClose();
      } else {
        toast("Failed to add expense", "error");
      }
    } catch {
      toast("Failed to add expense", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Bottom sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 shadow-2xl p-5 pb-8 md:left-auto md:right-6 md:bottom-24 md:w-80 md:rounded-2xl md:border md:pb-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CreditCard size={16} className="text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Quick expense</h3>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-3">
          <input
            autoFocus
            type="text"
            placeholder="What did you spend on?"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />

          <div className="flex gap-2">
            <input
              type="number"
              placeholder="0.00"
              step="0.01"
              min="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
              className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <select
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          {/* Category chips */}
          <div className="flex flex-wrap gap-1.5">
            {EXPENSE_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setForm({ ...form, category: cat.value })}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors border ${
                  form.category === cat.value
                    ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300"
                    : "border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={saving || !form.title.trim() || !form.amount}
            className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {saving ? <><Loader2 size={14} className="animate-spin" />Saving…</> : "Add expense"}
          </button>
        </form>
      </div>
    </>
  );
}

export function FloatingActionButton() {
  const pathname = usePathname();
  const tripMatch = pathname.match(/^\/trips\/([a-f0-9-]{36})/);
  const tripId = tripMatch?.[1] ?? null;
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 400);
    return () => clearTimeout(t);
  }, []);

  // Close expense sheet on navigation
  useEffect(() => { setOpen(false); }, [pathname]);

  // Only show on trip sub-pages (not the overview itself, not the /trips list)
  const isOverview = tripId && pathname === `/trips/${tripId}`;
  const isTripsHub = pathname === "/trips";
  if (!tripId || isOverview || isTripsHub) return null;

  return (
    <>
      {/* FAB button */}
      <div
        className={`fixed bottom-24 right-4 z-40 transition-all duration-300 md:bottom-6 md:right-6 ${
          mounted ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95"
        }`}
      >
        <button
          onClick={() => setOpen((v) => !v)}
          className={`flex h-14 w-14 items-center justify-center rounded-full shadow-xl shadow-indigo-900/20 transition-all duration-200 active:scale-95 hover:scale-105 ${
            open ? "bg-zinc-700 dark:bg-zinc-200 rotate-45" : "bg-indigo-600 hover:bg-indigo-700"
          }`}
          aria-label={open ? "Close" : "Quick add expense"}
          style={{ transition: "transform 0.2s ease, background-color 0.2s ease, rotate 0.2s ease" }}
        >
          <Plus size={22} className={open ? "text-white dark:text-zinc-900" : "text-white"} />
        </button>
      </div>

      {/* Quick expense sheet */}
      {open && tripId && <QuickExpenseSheet tripId={tripId} onClose={() => setOpen(false)} />}
    </>
  );
}
