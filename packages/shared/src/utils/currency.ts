import type { ExpenseCurrency } from "../types/expense";

export function formatCurrency(amount: number, currency: ExpenseCurrency | string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function sumExpensesByCategory<T extends { category: string; amount: number }>(
  expenses: T[]
): Record<string, number> {
  return expenses.reduce<Record<string, number>>((acc, expense) => {
    acc[expense.category] = (acc[expense.category] ?? 0) + expense.amount;
    return acc;
  }, {});
}

export function totalExpenses<T extends { amount: number }>(expenses: T[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}
