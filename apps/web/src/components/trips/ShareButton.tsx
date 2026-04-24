"use client";

import { useState } from "react";
import { Share2, Copy, Check, EyeOff, Globe } from "lucide-react";

interface ShareButtonProps {
  tripId: string;
  initialToken?: string | null;
  initialPublic?: boolean;
}

export function ShareButton({ tripId, initialToken, initialPublic }: ShareButtonProps) {
  const [open, setOpen]         = useState(false);
  const [isPublic, setIsPublic] = useState(initialPublic ?? false);
  const [token, setToken]       = useState(initialToken ?? null);
  const [loading, setLoading]   = useState(false);
  const [copied, setCopied]     = useState(false);

  const shareUrl = token
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/p/${token}`
    : null;

  async function enable() {
    setLoading(true);
    const res  = await fetch(`/api/trips/${tripId}/share`, { method: "POST" });
    const body = await res.json();
    if (res.ok) {
      setToken(body.data.shareToken);
      setIsPublic(true);
    }
    setLoading(false);
  }

  async function disable() {
    setLoading(true);
    await fetch(`/api/trips/${tripId}/share`, { method: "DELETE" });
    setIsPublic(false);
    setLoading(false);
  }

  async function copyLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-700 dark:hover:text-indigo-400 transition-all"
      >
        <Share2 className="h-4 w-4" />
        Share trip
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />

          {/* Popover */}
          <div className="absolute right-0 top-full mt-2 z-40 w-80 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl p-4 space-y-4">
            <div>
              <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Share this trip</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Anyone with the link can view your itinerary — no account needed.
              </p>
            </div>

            {/* Toggle */}
            <div className="flex items-center justify-between rounded-xl bg-zinc-50 dark:bg-zinc-800/60 px-3 py-2.5">
              <div className="flex items-center gap-2">
                {isPublic
                  ? <Globe className="h-4 w-4 text-emerald-500" />
                  : <EyeOff className="h-4 w-4 text-zinc-400" />
                }
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {isPublic ? "Public link active" : "Link disabled"}
                </span>
              </div>
              <button
                onClick={isPublic ? disable : enable}
                disabled={loading}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                  isPublic ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    isPublic ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Link field */}
            {isPublic && shareUrl && (
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={shareUrl}
                  className="flex-1 min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-xs text-zinc-600 dark:text-zinc-400 font-mono truncate focus:outline-none"
                />
                <button
                  onClick={copyLink}
                  className="shrink-0 flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
                >
                  {copied
                    ? <><Check className="h-3.5 w-3.5" /> Copied!</>
                    : <><Copy className="h-3.5 w-3.5" /> Copy</>
                  }
                </button>
              </div>
            )}

            {isPublic && (
              <p className="text-[11px] text-zinc-400 dark:text-zinc-600">
                🔒 Expenses, journal and private notes are never shared.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
