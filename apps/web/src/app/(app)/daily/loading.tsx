export default function DailyLoading() {
  return (
    <div className="min-h-full bg-gradient-to-b from-indigo-50/40 to-transparent dark:from-indigo-950/10">
      <div className="mx-auto max-w-2xl px-6 py-8 animate-pulse">
        {/* Date header */}
        <div className="mb-8 space-y-2">
          <div className="h-3 w-20 bg-indigo-200 dark:bg-indigo-900 rounded" />
          <div className="h-8 w-40 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
          <div className="h-4 w-32 bg-zinc-100 dark:bg-zinc-800 rounded" />
        </div>

        <div className="space-y-6">
          {/* Trip badge */}
          <div className="h-7 w-36 bg-indigo-100 dark:bg-indigo-900/40 rounded-full" />

          {/* Morning briefing skeleton */}
          <div className="rounded-2xl border border-indigo-100 dark:border-indigo-900 p-5 space-y-2">
            <div className="h-3 w-28 bg-indigo-200 dark:bg-indigo-900 rounded mb-3" />
            <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded" />
            <div className="h-3 w-5/6 bg-zinc-100 dark:bg-zinc-800 rounded" />
            <div className="h-3 w-4/6 bg-zinc-100 dark:bg-zinc-800 rounded" />
          </div>

          {/* Events */}
          <div className="space-y-2">
            <div className="h-3 w-32 bg-zinc-200 dark:bg-zinc-800 rounded mb-3" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900" />
            ))}
          </div>

          {/* Checklist */}
          <div className="space-y-2">
            <div className="h-3 w-28 bg-zinc-200 dark:bg-zinc-800 rounded mb-3" />
            <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full mb-3" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-11 rounded-xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
