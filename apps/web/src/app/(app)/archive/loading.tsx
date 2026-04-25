export default function ArchiveLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 animate-pulse">
      <div className="mb-8 space-y-2">
        <div className="h-7 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
        <div className="h-4 w-64 bg-zinc-100 dark:bg-zinc-800 rounded" />
      </div>
      <div className="space-y-5">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800 overflow-hidden">
            <div className="h-28 bg-zinc-100 dark:bg-zinc-800" />
            <div className="p-5 space-y-3">
              <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded" />
              <div className="h-3 w-4/5 bg-zinc-100 dark:bg-zinc-800 rounded" />
              <div className="h-3 w-2/3 bg-zinc-100 dark:bg-zinc-800 rounded" />
              <div className="flex gap-5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="space-y-1">
                    <div className="h-4 w-10 bg-zinc-200 dark:bg-zinc-700 rounded" />
                    <div className="h-3 w-16 bg-zinc-100 dark:bg-zinc-800 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
