"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { mutate } from "swr";
import useSWR from "swr";
import { PlusCircle, Loader2, BookOpen } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

const prefFetcher = (url: string) =>
  fetch(url).then((r) => r.json()).then((r) => r.preferences as Record<string, string> | undefined);

// ── Quick Expense Modal ────────────────────────────────────────────────────────

interface QuickModalBaseProps {
  tripId: string;
  onClose: () => void;
}

function QuickExpenseModal({ tripId, onClose }: QuickModalBaseProps) {
  const { toast } = useToast();
  const { data: prefs } = useSWR("/api/user/profile", prefFetcher, { revalidateOnFocus: false });
  const defaultCurrency = prefs?.defaultCurrency ?? "EUR";
  const [form, setForm] = useState({ title: "", amount: "", currency: defaultCurrency, category: "OTHER" });

  // Sync currency once prefs load (only if user hasn't changed it yet)
  useEffect(() => {
    if (prefs?.defaultCurrency) {
      setForm((f) => ({ ...f, currency: prefs.defaultCurrency! }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs?.defaultCurrency]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

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
    try {
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
        toast("Expense added ✓");
        onClose();
      } else {
        toast("Failed to add expense — please try again", "error");
      }
    } catch {
      toast("Network error — please check your connection", "error");
    } finally {
      setSaving(false);
    }
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
              {[
                "USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "NZD",
                "CNY", "HKD", "SGD", "KRW", "THB", "MYR", "INR",
                "AED", "TRY", "ZAR", "BRL", "MXN",
                "NOK", "SEK", "DKK", "PLN", "CZK",
              ].map((c) => (
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

// ── Quick Journal Modal ────────────────────────────────────────────────────────

const MOODS = [
  { value: "AMAZING", label: "🤩", title: "Amazing" },
  { value: "HAPPY", label: "😊", title: "Happy" },
  { value: "OKAY", label: "😐", title: "Okay" },
  { value: "TIRED", label: "😴", title: "Tired" },
  { value: "STRESSED", label: "😤", title: "Stressed" },
];

function QuickJournalModal({ tripId, onClose }: QuickModalBaseProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Ctrl/Cmd+Enter to save
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      void handleSave();
    }
  };

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const autoTitle = title.trim() || `${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}`;
      const res = await fetch(`/api/trips/${tripId}/journal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: autoTitle,
          content: content.trim(),
          mood: mood ?? undefined,
          entryDate: today,
        }),
      });
      if (res.ok) {
        await mutate(`/api/trips/${tripId}/journal`);
        await mutate(`/api/trips/${tripId}/stats`);
        toast("Journal entry saved ✓");
        onClose();
      } else {
        toast("Failed to save entry", "error");
      }
    } catch {
      toast("Network error", "error");
    } finally {
      setSaving(false);
    }
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 border-b border-zinc-100 dark:border-zinc-800 px-5 py-3.5 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-violet-500" />
              Quick journal entry
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{today}</p>
          </div>
          {/* Mood picker */}
          <div className="flex items-center gap-1">
            {MOODS.map((m) => (
              <button
                key={m.value}
                type="button"
                title={m.title}
                onClick={() => setMood(mood === m.value ? null : m.value)}
                className={`text-lg rounded-lg px-1.5 py-1 transition-all ${
                  mood === m.value
                    ? "bg-violet-100 dark:bg-violet-900/40 scale-110 ring-1 ring-violet-300 dark:ring-violet-700"
                    : "opacity-50 hover:opacity-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3">
          <input
            type="text"
            placeholder={`Title (optional) — defaults to "${today}"`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
          <textarea
            autoFocus
            rows={5}
            placeholder="What happened today? What will you remember about this moment?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full resize-none rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 leading-relaxed"
          />
          <p className="text-[11px] text-zinc-400 dark:text-zinc-600">
            Tip: press <kbd className="font-mono bg-zinc-100 dark:bg-zinc-800 rounded px-1">⌘ Enter</kbd> to save quickly
          </p>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !content.trim()}
              className="flex-1 rounded-xl bg-violet-600 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</> : "Save entry"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── QuickActions ───────────────────────────────────────────────────────────────

export function QuickActions({ tripId }: { tripId: string }) {
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [journalOpen, setJournalOpen] = useState(false);

  const actions = [
    {
      type: "button" as const,
      onClick: () => setExpenseOpen(true),
      icon: <PlusCircle className="h-4 w-4 shrink-0" />,
      label: "Add expense",
      color: "hover:border-emerald-200 dark:hover:border-emerald-800 hover:text-emerald-700 dark:hover:text-emerald-400",
    },
    {
      type: "button" as const,
      onClick: () => setJournalOpen(true),
      icon: <BookOpen className="h-4 w-4 shrink-0" />,
      label: "Write note",
      color: "hover:border-violet-200 dark:hover:border-violet-800 hover:text-violet-700 dark:hover:text-violet-400",
    },
    {
      type: "link" as const,
      href: `/trips/${tripId}/vault?import=email`,
      icon: <span>📧</span>,
      label: "Forward email",
      color: "hover:border-indigo-200 dark:hover:border-indigo-800 hover:text-indigo-700 dark:hover:text-indigo-400",
    },
    {
      type: "link" as const,
      href: `/trips/${tripId}/vault?import=pdf`,
      icon: <span>📄</span>,
      label: "Upload PDF",
      color: "hover:border-indigo-200 dark:hover:border-indigo-800 hover:text-indigo-700 dark:hover:text-indigo-400",
    },
    {
      type: "link" as const,
      href: `/trips/${tripId}/timeline?add=event`,
      icon: <span>✏️</span>,
      label: "Add event",
      color: "hover:border-indigo-200 dark:hover:border-indigo-800 hover:text-indigo-700 dark:hover:text-indigo-400",
    },
  ];

  const baseClass =
    "flex items-center gap-2 rounded-xl border border-zinc-200/60 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-3 text-sm text-zinc-600 dark:text-zinc-400 transition-all";

  return (
    <>
      <div className="mt-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-3">
          Quick actions
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {actions.map((action) =>
            action.type === "button" ? (
              <button
                key={action.label}
                onClick={action.onClick}
                className={`${baseClass} ${action.color}`}
              >
                {action.icon}
                {action.label}
              </button>
            ) : (
              <Link
                key={action.label}
                href={action.href}
                className={`${baseClass} ${action.color}`}
              >
                {action.icon}
                {action.label}
              </Link>
            )
          )}
        </div>
      </div>

      {expenseOpen && <QuickExpenseModal tripId={tripId} onClose={() => setExpenseOpen(false)} />}
      {journalOpen && <QuickJournalModal tripId={tripId} onClose={() => setJournalOpen(false)} />}
    </>
  );
}
