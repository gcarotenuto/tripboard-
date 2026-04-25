"use client";

import Link from "next/link";
import { useState } from "react";
import { mutate } from "swr";
import { PlusCircle, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface QuickExpenseProps {
  tripId: string;
}

function QuickExpenseModal({ tripId, onClose }: QuickExpenseProps & { onClose: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ title: "", amount: "", currency: "EUR", category: "OTHER" });
  const [saving, setSaving] = useState(false);

  const CATEGORIES = [
    { value: "TRANSPORT", label: "🚗 Transport" },
    { value: "ACCOMMODATION", label: "🏨 Hotel" },
    { value: "FOOD", label: "🍽️ Food" },
    { value: "ACTIVITY", label: "🎯 Activity" },
    { value: "SHOPPING", label: "🛍️ Shopping" },
    { value: "OTHER", label: "📦 Other" },
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.amount) return;
    setSaving(true);

    const res = await fetch(`/api/trips/${tripId}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title.trim(),
        amount: parseFloat(form.amount),
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
      toast("Expense added");
      onClose();
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-5">
        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-4">Quick add expense</h3>
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
              min="0"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
              className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <select
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {["EUR", "USD", "GBP", "JPY", "CHF", "CAD", "AUD"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setForm({ ...form, category: cat.value })}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  form.category === cat.value
                    ? "bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300"
                    : "border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</> : "Add expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function QuickActions({ tripId }: { tripId: string }) {
  const [expenseOpen, setExpenseOpen] = useState(false);

  return (
    <>
      <div className="mt-8">
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Quick actions</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button
            onClick={() => setExpenseOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-zinc-200/60 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-3 text-sm text-zinc-600 dark:text-zinc-400 hover:border-indigo-200 dark:hover:border-indigo-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
          >
            <PlusCircle className="h-4 w-4 shrink-0" />
            Add expense
          </button>
          <Link
            href={`/trips/${tripId}/vault?import=email`}
            className="flex items-center gap-2 rounded-xl border border-zinc-200/60 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-3 text-sm text-zinc-600 dark:text-zinc-400 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors"
          >
            <span>📧</span>
            Forward email
          </Link>
          <Link
            href={`/trips/${tripId}/vault?import=pdf`}
            className="flex items-center gap-2 rounded-xl border border-zinc-200/60 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-3 text-sm text-zinc-600 dark:text-zinc-400 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors"
          >
            <span>📄</span>
            Upload PDF
          </Link>
          <Link
            href={`/trips/${tripId}/timeline?add=event`}
            className="flex items-center gap-2 rounded-xl border border-zinc-200/60 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-3 text-sm text-zinc-600 dark:text-zinc-400 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors"
          >
            <span>✏️</span>
            Add event
          </Link>
        </div>
      </div>

      {expenseOpen && (
        <QuickExpenseModal tripId={tripId} onClose={() => setExpenseOpen(false)} />
      )}
    </>
  );
}
