import type { Metadata } from "next";
import { DailyBoardView } from "@/components/daily/DailyBoardView";

export const metadata: Metadata = { title: "Daily Board" };

export default function DailyPage() {
  const now = new Date();
  const weekday = now.toLocaleDateString("en-US", { weekday: "long" });
  const dateStr = now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="min-h-full bg-gradient-to-b from-indigo-50/40 to-transparent dark:from-indigo-950/10">
      <div className="mx-auto max-w-2xl px-6 py-8">
        {/* Date header */}
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-1">
            Daily Board
          </p>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            {weekday}
          </h1>
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-0.5">{dateStr}</p>
        </div>

        <DailyBoardView />
      </div>
    </div>
  );
}
