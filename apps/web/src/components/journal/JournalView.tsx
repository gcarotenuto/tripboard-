"use client";

import useSWR from "swr";
import type { JournalEntry } from "@tripboard/shared";
import { formatDate } from "@tripboard/shared";
import { Spinner } from "@tripboard/ui";

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((r) => r.data);

export function JournalView({ tripId }: { tripId: string }) {
  const { data: entries, isLoading } = useSWR<JournalEntry[]>(
    `/api/trips/${tripId}/journal`,
    fetcher
  );

  if (isLoading) {
    return <div className="flex justify-center py-16"><Spinner /></div>;
  }

  if (!entries?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 p-12 text-center">
        <div className="text-4xl mb-3">📓</div>
        <h3 className="font-semibold text-zinc-800 dark:text-zinc-200">No journal entries yet</h3>
        <p className="mt-1 text-sm text-zinc-500">Write your first entry to start capturing memories.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <article
          key={entry.id}
          className="rounded-2xl border border-zinc-200/60 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-5 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">{entry.mood ?? "📝"}</span>
            <div>
              <p className="text-xs font-medium text-zinc-400">{formatDate(entry.entryDate)}</p>
              {entry.title && (
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{entry.title}</h3>
              )}
            </div>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-4 whitespace-pre-wrap">
            {entry.content}
          </p>
          {entry.locationName && (
            <p className="mt-3 text-xs text-zinc-400">📍 {entry.locationName}</p>
          )}
        </article>
      ))}
    </div>
  );
}
