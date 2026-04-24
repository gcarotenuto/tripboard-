"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

type State = "idle" | "loading" | "done" | "error";

export function AiItineraryButton({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [state, setState] = useState<State>("idle");
  const [count, setCount] = useState(0);

  const generate = async () => {
    setState("loading");
    try {
      const res = await fetch(`/api/trips/${tripId}/ai-itinerary`, { method: "POST" });
      if (!res.ok) {
        setState("error");
        return;
      }
      const json = await res.json() as { data: { count: number } };
      setCount(json.data.count);
      setState("done");
    } catch {
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-3 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {count} events added
        </div>
        <button
          onClick={() => router.push(`/trips/${tripId}/timeline`)}
          className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          View timeline →
        </button>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          AI error — try again
        </div>
        <button
          onClick={() => setState("idle")}
          className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={generate}
      disabled={state === "loading"}
      className={`
        group relative inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold
        transition-all duration-200 overflow-hidden
        ${state === "loading"
          ? "bg-indigo-500 text-white cursor-not-allowed"
          : "bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500 active:scale-95 shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30"
        }
      `}
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none overflow-hidden rounded-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
      </div>

      {state === "loading" ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Generating itinerary…</span>
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" />
          <span>✨ Generate itinerary</span>
        </>
      )}
    </button>
  );
}
