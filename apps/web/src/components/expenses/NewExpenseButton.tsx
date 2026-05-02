"use client";

import { useState, useEffect } from "react";
import { mutate } from "swr";
import useSWR from "swr";
import type { ExpenseCategory, ExpenseCurrency } from "@tripboard/shared";
import { EXPENSE_CATEGORY_LABELS, EXPENSE_CATEGORY_EMOJIS, ALL_CURRENCIES } from "@tripboard/shared";
import { useToast } from "@/components/ui/Toast";

const CATEGORIES = Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[];
const prefFetcher = (url: string) =>
  fetch(url).then((r) => r.json()).then((r) => r.preferences as Record<string, string> | undefined);

export function NewExpenseButton({ tripId }: { tripId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { data: prefs } = useSWR("/api/user/profile", prefFetcher, { revalidateOnFocus: false });
  const defaultCurrency = (prefs?.defaultCurrency as ExpenseCurrency | undefined) ?? "USD";

  const [form, setForm] = useState({
    title: "",
    amount: "",
    currency: defaultCurrency,
    category: "OTHER" as ExpenseCategory,
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  // Sync default currency once prefs load
  useEffect(() => {
    if (prefs?.defaultCurrency) {
      setForm((f) => ({ ...f, currency: prefs.defaultCurrency as ExpenseCurrency }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs?.defaultCurrency]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.amount) return;
    setLoading(true);

    const amount = parseFloat(form.amount);
    try {
      const res = await fetch(`/api/trips/${tripId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          amount,
          currency: form.currency,
          amountUsd: amount,
          category: form.category,
          date: form.date,
          notes: form.notes || undefined,
        }),
      });
      if (!res.ok) throw new Error("save failed");

      await mutate(`/api/trips/${tripId}/expenses`);
      await mutate(`/api/trips/${tripId}/expenses/summary`);
      await mutate(`/api/trips/${tripId}/stats`);

      toast(`${EXPENSE_CATEGORY_EMOJIS[form.category]} Expense logged`);
      setForm({ title: "", amount: "", currency: defaultCurrency, category: "OTHER", date: new Date().toISOString().split("T")[0], notes: "" });
      setOpen(false);
    } catch {
      toast("Failed to save expense — please try again", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 active:scale-95 transition-all"
      >
        + Add Expense
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />

          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Add Expense</h2>
              <button type="button" onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Description *</label>
                <input
                  autoFocus
                  type="text"
                  placeholder="e.g. Dinner at local restaurant"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Amount + Currency */}
              <div className="grid grid-cols-5 gap-2">
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    required
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Currency</label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value as ExpenseCurrency })}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {ALL_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Category</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setForm({ ...form, category: cat })}
                      className={`flex flex-col items-center gap-0.5 rounded-xl border py-2 px-1 text-xs font-medium transition-colors ${
                        form.category === cat
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"
                          : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-600"
                      }`}
                    >
                      <span className="text-base">{EXPENSE_CATEGORY_EMOJIS[cat]}</span>
                      <span className="leading-tight text-center" style={{ fontSize: "10px" }}>
                        {EXPENSE_CATEGORY_LABELS[cat].split(" ")[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Notes <span className="text-zinc-400 font-normal">(optional)</span></label>
                <input
                  type="text"
                  placeholder="Any extra details..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !form.title.trim() || !form.amount}
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 active:scale-95 transition-all mt-2"
              >
                {loading ? "Saving…" : "Add Expense 💳"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
