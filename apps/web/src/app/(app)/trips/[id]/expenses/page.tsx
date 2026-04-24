import type { Metadata } from "next";
import { ExpenseList } from "@/components/expenses/ExpenseList";
import { ExpenseSummaryCard } from "@/components/expenses/ExpenseSummaryCard";
import { NewExpenseButton } from "@/components/expenses/NewExpenseButton";
import { Download } from "lucide-react";

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
        <div className="flex items-center gap-2">
          <a
            href={`/api/trips/${params.id}/expenses/export`}
            download
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-700 dark:hover:text-zinc-200 transition-all"
            title="Download expenses as CSV"
          >
            <Download className="h-3.5 w-3.5" />
            CSV
          </a>
          <NewExpenseButton tripId={params.id} />
        </div>
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
