"use client";

import useSWR from "swr";
import type { Expense } from "@tripboard/shared";
import { EXPENSE_CATEGORY_EMOJIS, EXPENSE_CATEGORY_LABELS, formatCurrency, formatDate } from "@tripboard/shared";
import { Spinner } from "@tripboard/ui";

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((r) => r.data);

export function ExpenseList({ tripId }: { tripId: string }) {
  const { data: expenses, isLoading } = useSWR<Expense[]>(
    `/api/trips/${tripId}/expenses`,
    fetcher
  );

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
    <div className="space-y-2">
      {expenses.map((expense) => (
        <div
          key={expense.id}
          className="flex items-center gap-3 rounded-xl border border-zinc-200/60 bg-white dark:border-zinc-800 dark:bg-zinc-900 px-4 py-3"
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
        </div>
      ))}
    </div>
  );
}
