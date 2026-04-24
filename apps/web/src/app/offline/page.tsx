"use client";

import Link from "next/link";
import { Plane, WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
            <Plane className="h-7 w-7 text-white" />
          </div>
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <WifiOff className="h-8 w-8 text-zinc-400 dark:text-zinc-500" />
          </div>
        </div>

        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          You&apos;re offline
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-8">
          TripBoard needs a connection to load your trips. Check your network and try again.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/trips"
            className="block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
          >
            Go to Trip Hub
          </Link>
        </div>
      </div>
    </div>
  );
}
