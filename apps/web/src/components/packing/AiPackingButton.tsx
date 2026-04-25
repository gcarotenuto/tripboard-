"use client";

import { useState } from "react";
import { mutate } from "swr";
import { Sparkles, Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

type State = "idle" | "loading" | "done" | "error";

interface AiPackingButtonProps {
  tripId: string;
  onDone?: (count: number) => void;
}

export function AiPackingButton({ tripId, onDone }: AiPackingButtonProps) {
  const { toast } = useToast();
  const [state, setState] = useState<State>("idle");
  const [count, setCount] = useState(0);

  const run = async () => {
    setState("loading");
    try {
      const res = await fetch(`/api/trips/${tripId}/packing/ai-suggest`, { method: "POST" });
      if (!res.ok) { setState("error"); return; }
      const json = await res.json() as { data: { count: number } };
      setCount(json.data.count);
      setState("done");
      toast(`🧳 ${json.data.count} packing items added`);
      // Invalidate SWR cache so PackingView re-fetches
      await mutate(`/api/trips/${tripId}/packing`);
      onDone?.(json.data.count);
    } catch {
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {count} items added
        </div>
        <button
          onClick={run}
          className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          title="Regenerate suggestions"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-3 py-1.5 text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="h-3.5 w-3.5" />
          AI error
        </div>
        <button onClick={run} className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={run}
      disabled={state === "loading"}
      className="group relative inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60 active:scale-95 transition-all shadow-sm shadow-indigo-500/20 overflow-hidden"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none overflow-hidden rounded-xl transition-opacity duration-300">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
      </div>
      {state === "loading" ? (
        <><Loader2 className="h-3.5 w-3.5 animate-spin" />Generating…</>
      ) : (
        <><Sparkles className="h-3.5 w-3.5" />✨ AI suggest</>
      )}
    </button>
  );
}
