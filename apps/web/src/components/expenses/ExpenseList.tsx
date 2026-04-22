"use client";

import { useState } from "react";
import useSWR from "swr";
import { Trash2, Pencil, X } from "lucide-react";
import type { Expense } from "@tripboard/shared";
import { EXPENSE_CATEGORY_EMOJIS, EXPENSE_CATEGORY_LABELS, formatCurrency, formatDate } from "@tripboard/shared";
import { Spinner } from "@tripboard/ui";

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((r) => r.data);

const CURRENCIES = ["EUR", "USD", "GBP", "JPY", "CHF", "AUD", "CAD", "MXN"] as const;
const CATEGORIES = ["TRANSPORT", "ACCOMMODATION", "FOOD", "ACTIVITY", "SHOPPING", "HEALTH", "OTHER"] as const;

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
      <div className="space-y-2">
        {expenses.map((expense) => (
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
