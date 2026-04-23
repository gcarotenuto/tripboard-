"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { Trash2, Pencil, X, Search } from "lucide-react";
import type { Expense, ExpenseCategory } from "@tripboard/shared";
import { EXPENSE_CATEGORY_EMOJIS, EXPENSE_CATEGORY_LABELS, formatCurrency, formatDate } from "@tripboard/shared";
import { Spinner } from "@tripboard/ui";

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((r) => r.data);

const CURRENCIES = ["EUR", "USD", "GBP", "JPY", "CHF", "AUD", "CAD", "MXN"] as const;
const CATEGORIES = ["TRANSPORT", "ACCOMMODATION", "FOOD", "ACTIVITY", "SHOPPING", "HEALTH", "OTHER"] as const;

type SortOption = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

const SELECT_CLASS =
  "rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-400";

interface EditForm {
  title: string;
  amount: string;
  currency: string;
  category: string;
  date: string;
  notes: string;
}

export function ExpenseList({ tripId }: { tripId: string }) {
  const { data: expenses, isLoading, mutate } = useSWR<Expense[]>(
    `/api/trips/${tripId}/expenses`,
    fetcher
  );

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [form, setForm] = useState<EditForm>({ title: "", amount: "", currency: "EUR", category: "OTHER", date: "", notes: "" });
  const [saving, setSaving] = useState(false);

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
    if (!window.confirm("Delete this expense?")) return;
    await fetch(`/api/trips/${tripId}/expenses/${expense.id}`, { method: "DELETE" });
    mutate(`/api/trips/${tripId}/expenses`);
  }

  async function handleSave() {
    if (!editingExpense) return;
    setSaving(true);
    await fetch(`/api/trips/${tripId}/expenses/${editingExpense.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        amount: parseFloat(form.amount),
        currency: form.currency,
        category: form.category,
        date: form.date,
        notes: form.notes || null,
      }),
    });
    setSaving(false);
    closeEdit();
    mutate(`/api/trips/${tripId}/expenses`);
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

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>;

  if (!expenses?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 p-10 text-center">
        <div className="text-4xl mb-3">💳</div>
        <p className="text-sm text-zinc-500">No expenses recorded yet.</p>
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
              <button
                onClick={() => openEdit(expense)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:text-indigo-400 dark:hover:bg-indigo-950/40 transition-colors"
                title="Edit expense"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => handleDelete(expense)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-950/40 transition-colors"
                title="Delete expense"
              >
                <Trash2 size={14} />
              </button>
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
                <label className="block text-xs font-medium text-zinc-500 mb-1">Title</label>
                <input
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Currency</label>
                  <select
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Date</label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Notes</label>
                <textarea
                  rows={2}
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
                disabled={saving}
                className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
