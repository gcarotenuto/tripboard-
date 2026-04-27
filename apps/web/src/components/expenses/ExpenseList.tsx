"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { Trash2, Pencil, X, Search, AlertTriangle } from "lucide-react";
import type { Expense, ExpenseCategory } from "@tripboard/shared";
import { EXPENSE_CATEGORY_EMOJIS, EXPENSE_CATEGORY_LABELS, formatCurrency, formatDate } from "@tripboard/shared";
import { useToast } from "@/components/ui/Toast";

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((r) => r.data);

const CURRENCIES = ["EUR", "USD", "GBP", "JPY", "CHF", "AUD", "CAD", "MXN"] as const;
const CATEGORIES = ["TRANSPORT", "ACCOMMODATION", "FOOD", "ACTIVITY", "SHOPPING", "HEALTH", "OTHER"] as const;

type SortOption = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

const SELECT_CLASS =
  "rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-400";

const INPUT_CLASS =
  "w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500";

interface EditForm {
  title: string;
  amount: string;
  currency: string;
  category: string;
  date: string;
  notes: string;
}

function ExpenseSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="flex gap-2 mb-4">
        <div className="h-8 flex-1 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-8 w-32 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-8 w-32 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
      </div>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3">
          <div className="h-7 w-7 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-36 bg-zinc-200 dark:bg-zinc-700 rounded" />
            <div className="h-3 w-24 bg-zinc-100 dark:bg-zinc-800 rounded" />
          </div>
          <div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-700 rounded shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function ExpenseList({ tripId }: { tripId: string }) {
  const { data: expenses, isLoading, mutate } = useSWR<Expense[]>(
    `/api/trips/${tripId}/expenses`,
    fetcher
  );
  const { toast } = useToast();

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [form, setForm] = useState<EditForm>({ title: "", amount: "", currency: "EUR", category: "OTHER", date: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter + sort state
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [sort, setSort] = useState<SortOption>("date-desc");
  const [search, setSearch] = useState("");

  function openEdit(expense: Expense) {
    setEditingExpense(expense);
    setForm({
      title: expense.title,
      amount: String(expense.amount),
      currency: expense.currency,
      category: expense.category,
      date: expense.date ? String(expense.date).split("T")[0] : "",
      notes: expense.notes ?? "",
    });
  }

  function closeEdit() {
    setEditingExpense(null);
  }

  async function handleDelete(expense: Expense) {
    setDeletingId(null);
    try {
      await fetch(`/api/trips/${tripId}/expenses/${expense.id}`, { method: "DELETE" });
      mutate();
      toast("Expense deleted");
    } catch {
      toast("Failed to delete expense", "error");
    }
  }

  async function handleSave() {
    if (!editingExpense) return;
    if (!form.title.trim()) {
      toast("Title is required", "error");
      return;
    }
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      toast("Enter a valid amount greater than 0", "error");
      return;
    }
    setSaving(true);
    try {
      await fetch(`/api/trips/${tripId}/expenses/${editingExpense.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          amount,
          currency: form.currency,
          category: form.category,
          date: form.date,
          notes: form.notes || null,
        }),
      });
      closeEdit();
      mutate();
      toast("Expense updated");
    } catch {
      toast("Failed to save expense", "error");
    } finally {
      setSaving(false);
    }
  }

  // Derive available categories from loaded expenses
  const availableCategories = useMemo<ExpenseCategory[]>(() => {
    if (!expenses) return [];
    const seen = new Set<ExpenseCategory>();
    for (const e of expenses) seen.add(e.category);
    return Array.from(seen).sort();
  }, [expenses]);

  // Apply filter + sort + search
  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];
    let list = expenses.slice();
    if (filterCategory !== "ALL") {
      list = list.filter((e) => e.category === filterCategory);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((e) => e.title.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      if (sort === "date-desc") return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sort === "date-asc") return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sort === "amount-desc") return b.amount - a.amount;
      if (sort === "amount-asc") return a.amount - b.amount;
      return 0;
    });
    return list;
  }, [expenses, filterCategory, sort, search]);

  if (isLoading) return <ExpenseSkeleton />;

  if (!expenses?.length) {
    return (
      <div className="rounded-2xl border border-zinc-200/70 dark:border-zinc-800 overflow-hidden">
        {/* Hero */}
        <div className="bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-cyan-50/30 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-cyan-950/10 px-8 py-7 text-center">
          <div className="text-5xl mb-3">💳</div>
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">No expenses yet</h3>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
            Track every coffee, tour, and taxi — TripBoard converts everything to a single currency automatically.
          </p>
        </div>

        {/* Category preview */}
        <div className="border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-3">Expense categories</p>
          <div className="flex flex-wrap gap-2">
            {[
              { emoji: "🚗", label: "Transport" },
              { emoji: "🏨", label: "Hotel" },
              { emoji: "🍽️", label: "Food" },
              { emoji: "🎯", label: "Activities" },
              { emoji: "🛍️", label: "Shopping" },
              { emoji: "💊", label: "Health" },
            ].map(({ emoji, label }) => (
              <span key={label} className="inline-flex items-center gap-1.5 rounded-full border border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-1 text-xs text-zinc-600 dark:text-zinc-400">
                <span>{emoji}</span><span>{label}</span>
              </span>
            ))}
          </div>
          <p className="mt-4 text-xs text-zinc-400 dark:text-zinc-500 text-center">
            Tap <strong className="text-zinc-600 dark:text-zinc-300">+ Add Expense</strong> above to log your first spend.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[140px]">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${SELECT_CLASS} w-full pl-7`}
          />
        </div>

        {/* Category filter */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className={SELECT_CLASS}
        >
          <option value="ALL">All categories</option>
          {availableCategories.map((cat) => (
            <option key={cat} value={cat}>{EXPENSE_CATEGORY_LABELS[cat]}</option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className={SELECT_CLASS}
        >
          <option value="date-desc">Date (newest)</option>
          <option value="date-asc">Date (oldest)</option>
          <option value="amount-desc">Amount (high→low)</option>
          <option value="amount-asc">Amount (low→high)</option>
        </select>
      </div>

      {filteredExpenses.length === 0 && (
        <p className="text-sm text-zinc-400 dark:text-zinc-500 py-6 text-center">No expenses match your filters.</p>
      )}

      <div className="space-y-2">
        {filteredExpenses.map((expense) => (
          <div
            key={expense.id}
            className="group flex items-center gap-3 rounded-xl border border-zinc-200/60 bg-white dark:border-zinc-800 dark:bg-zinc-900 px-4 py-3"
          >
            <span className="text-xl shrink-0">
              {EXPENSE_CATEGORY_EMOJIS[expense.category] ?? "💳"}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                {expense.title}
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                {EXPENSE_CATEGORY_LABELS[expense.category]} · {formatDate(expense.date)}
              </p>
            </div>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 shrink-0">
              {formatCurrency(expense.amount, expense.currency)}
            </span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              {deletingId === expense.id ? (
                /* Inline confirmation */
                <div className="flex items-center gap-1.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-2.5 py-1">
                  <AlertTriangle size={12} className="text-red-500 shrink-0" />
                  <span className="text-xs font-medium text-red-700 dark:text-red-400">Delete?</span>
                  <button
                    onClick={() => handleDelete(expense)}
                    className="text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                  >
                    Yes
                  </button>
                  <span className="text-red-300 dark:text-red-800">·</span>
                  <button
                    onClick={() => setDeletingId(null)}
                    className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                  >
                    No
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => openEdit(expense)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:text-indigo-400 dark:hover:bg-indigo-950/40 transition-colors"
                    title="Edit expense"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeletingId(expense.id)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-950/40 transition-colors"
                    title="Delete expense"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Edit modal */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Edit Expense</h2>
              <button onClick={closeEdit} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Title <span className="text-red-400">*</span></label>
                <input
                  className={INPUT_CLASS}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Dinner at restaurant"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Amount <span className="text-red-400">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className={INPUT_CLASS}
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Currency</label>
                  <select
                    className={INPUT_CLASS}
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  >
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Category</label>
                <select
                  className={INPUT_CLASS}
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{EXPENSE_CATEGORY_LABELS[c as ExpenseCategory] ?? c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Date</label>
                <input
                  type="date"
                  className={INPUT_CLASS}
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Notes</label>
                <textarea
                  rows={2}
                  className={`${INPUT_CLASS} resize-none`}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Optional notes…"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeEdit}
                className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-700 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.title.trim() || !form.amount}
                className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
