import type { Metadata } from "next";
import { DailyBoardView } from "@/components/daily/DailyBoardView";

export const metadata: Metadata = { title: "Daily Board" };

export default function DailyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {/* Date header */}
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-1">
          Today
        </p>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </h2>
      </div>

      <DailyBoardView />
    </div>
  );
}
