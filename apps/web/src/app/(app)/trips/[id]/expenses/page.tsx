import type { Metadata } from "next";
import { ExpenseList } from "@/components/expenses/ExpenseList";
import { ExpenseSummaryCard } from "@/components/expenses/ExpenseSummaryCard";

export const metadata: Metadata = { title: "Expenses" };

interface ExpensesPageProps {
  params: { id: string };
}

export default function ExpensesPage({ params }: ExpensesPageProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Expenses</h2>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">Track your travel spending.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 active:scale-95 transition-all">
          + Add Expense
        </button>
      </div>

      {/* Summary */}
      <ExpenseSummaryCard tripId={params.id} />

      {/* List */}
      <div className="mt-6">
        <ExpenseList tripId={params.id} />
      </div>
    </div>
  );
}
