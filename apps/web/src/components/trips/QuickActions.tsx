"use client";

import Link from "next/link";

export function QuickActions({ tripId }: { tripId: string }) {
  return (
    <div className="mt-8">
      <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Quick import</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Link
          href={`/trips/${tripId}/vault?import=email`}
          className="flex items-center gap-2 rounded-xl border border-zinc-200/60 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-3 text-sm text-zinc-600 dark:text-zinc-400 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors"
        >
          <span>📧</span>
          Forward email
        </Link>
        <Link
          href={`/trips/${tripId}/vault?import=pdf`}
          className="flex items-center gap-2 rounded-xl border border-zinc-200/60 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-3 text-sm text-zinc-600 dark:text-zinc-400 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors"
        >
          <span>📄</span>
          Upload PDF
        </Link>
        <Link
          href={`/trips/${tripId}/vault?import=photo`}
          className="flex items-center gap-2 rounded-xl border border-zinc-200/60 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-3 text-sm text-zinc-600 dark:text-zinc-400 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors"
        >
          <span>📸</span>
          Photo / scan
        </Link>
        <Link
          href={`/trips/${tripId}/timeline?add=event`}
          className="flex items-center gap-2 rounded-xl border border-zinc-200/60 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-3 text-sm text-zinc-600 dark:text-zinc-400 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors"
        >
          <span>✏️</span>
          Manual entry
        </Link>
      </div>
    </div>
  );
}
