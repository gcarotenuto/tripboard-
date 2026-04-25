"use client";

import { useState } from "react";
import { mutate } from "swr";
import { Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface Props {
  tripId: string;
  hasExisting: boolean;
}

export function GenerateMemoryCapsuleButton({ tripId, hasExisting }: Props) {
  const { toast } = useToast();
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  const handleGenerate = async (e: React.MouseEvent) => {
    e.preventDefault(); // prevent Link navigation
    e.stopPropagation();
    setState("loading");

    try {
      const res = await fetch(`/api/trips/${tripId}/memory-capsule`, { method: "POST" });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        if (json.error === "AI not configured") {
          toast("AI not configured — add ANTHROPIC_API_KEY");
        } else {
          toast("Failed to generate memory capsule");
        }
        setState("error");
        return;
      }

      await mutate("/api/trips?status=COMPLETED,ARCHIVED");
      toast("✦ Memory Capsule generated");
      setState("done");
    } catch {
      toast("Something went wrong");
      setState("error");
    }
  };

  if (state === "done") return null;

  return (
    <button
      onClick={handleGenerate}
      disabled={state === "loading"}
      className={`
        inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold
        transition-all duration-200 disabled:opacity-60
        ${hasExisting
          ? "border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-indigo-300 hover:text-indigo-600 dark:hover:border-indigo-700 dark:hover:text-indigo-400 bg-white dark:bg-zinc-900"
          : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shadow-sm shadow-indigo-200 dark:shadow-indigo-900/30"
        }
      `}
    >
      {state === "loading" ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Generating…
        </>
      ) : (
        <>
          <Sparkles className="h-3.5 w-3.5" />
          {hasExisting ? "Regenerate capsule" : "✦ Generate Memory Capsule"}
        </>
      )}
    </button>
  );
}
