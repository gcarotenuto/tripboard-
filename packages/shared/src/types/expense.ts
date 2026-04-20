export type ExpenseCategory =
  | "TRANSPORT"
  | "ACCOMMODATION"
  | "FOOD"
  | "ACTIVITIES"
  | "SHOPPING"
  | "HEALTH"
  | "COMMUNICATION"
  | "INSURANCE"
  | "VISA_FEES"
  | "TIPS"
  | "OTHER";

export type ExpenseCurrency =
  | "USD" | "EUR" | "GBP" | "JPY" | "CAD" | "AUD"
  | "CHF" | "CNY" | "INR" | "BRL" | "MXN" | "SGD"
  | "HKD" | "NOK" | "SEK" | "DKK" | "PLN" | "CZK"
  | "HUF" | "RON";

export interface Expense {
  id: string;
  userId: string;
  tripId: string;
  title: string;
  amount: number;
  currency: ExpenseCurrency;
  amountUsd: number | null;
  exchangeRate: number | null;
  category: ExpenseCategory;
  date: string;
  notes: string | null;
  sourceDocumentId: string | null;
  isPaid: boolean;
  paidBy: string | null;
  receiptUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseInput {
  title: string;
  amount: number;
  currency: ExpenseCurrency;
  category: ExpenseCategory;
  date: string;
  notes?: string;
  isPaid?: boolean;
  paidBy?: string;
  sourceDocumentId?: string;
}

export interface ExpenseSummary {
  totalByCurrency: Record<string, number>;
  totalUsd: number;
  byCategory: Record<ExpenseCategory, number>;
  expenseCount: number;
}

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  TRANSPORT: "Transport",
  ACCOMMODATION: "Accommodation",
  FOOD: "Food & Drink",
  ACTIVITIES: "Activities",
  SHOPPING: "Shopping",
  HEALTH: "Health",
  COMMUNICATION: "Communication",
  INSURANCE: "Insurance",
  VISA_FEES: "Visa & Fees",
  TIPS: "Tips",
  OTHER: "Other",
};

export const EXPENSE_CATEGORY_EMOJIS: Record<ExpenseCategory, string> = {
  TRANSPORT: "🚌",
  ACCOMMODATION: "🏨",
  FOOD: "🍽️",
  ACTIVITIES: "🎯",
  SHOPPING: "🛍️",
  HEALTH: "💊",
  COMMUNICATION: "📱",
  INSURANCE: "🛡️",
  VISA_FEES: "🛂",
  TIPS: "💡",
  OTHER: "💳",
};

export const EXPENSE_CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  TRANSPORT: "#6366f1",
  ACCOMMODATION: "#8b5cf6",
  FOOD: "#f59e0b",
  ACTIVITIES: "#10b981",
  SHOPPING: "#ec4899",
  HEALTH: "#ef4444",
  COMMUNICATION: "#3b82f6",
  INSURANCE: "#64748b",
  VISA_FEES: "#0ea5e9",
  TIPS: "#84cc16",
  OTHER: "#6b7280",
};
