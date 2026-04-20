"use client";

import { useRouter } from "next/navigation";
import { cn } from "@tripboard/ui";

interface ViewToggleProps {
  currentView: "logistics" | "moments";
  tripId: string;
}

export function ViewToggle({ currentView, tripId }: ViewToggleProps) {
  const router = useRouter();

  return (
    <div className="flex items-center rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 p-1 gap-1">
      <button
        onClick={() => router.push(`/trips/${tripId}/timeline?view=logistics`)}
        className={cn(
          "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
          currentView === "logistics"
            ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
            : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
        )}
      >
        📅 Logistics
      </button>
      <button
        onClick={() => router.push(`/trips/${tripId}/timeline?view=moments`)}
        className={cn(
          "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
          currentView === "moments"
            ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
            : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
        )}
      >
        ✨ Moments
      </button>
    </div>
  );
}
