export default function PackingLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 animate-pulse">
      <div className="mb-6 flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-7 w-36 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
          <div className="h-4 w-52 bg-zinc-100 dark:bg-zinc-800 rounded" />
        </div>
        <div className="h-9 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
      </div>
      {/* Category sections */}
      {Array.from({ length: 3 }).map((_, s) => (
        <div key={s} className="mb-6">
          <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded mb-3" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 flex items-center gap-3">
                <div className="h-5 w-5 rounded bg-zinc-100 dark:bg-zinc-800 shrink-0" />
                <div className="h-4 flex-1 bg-zinc-100 dark:bg-zinc-800 rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
