export default function TripsLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 animate-pulse">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-56 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
          <div className="h-4 w-44 bg-zinc-100 dark:bg-zinc-800 rounded" />
        </div>
        <div className="h-9 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
      </div>

      {/* Stats strip */}
      <div className="mb-6 flex gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-8 w-24 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
        ))}
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-20 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
        ))}
      </div>

      {/* Trip cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-zinc-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
            <div className="h-36 bg-zinc-100 dark:bg-zinc-800" />
            <div className="p-4 space-y-2.5">
              <div className="h-4 w-3/4 bg-zinc-200 dark:bg-zinc-700 rounded-lg" />
              <div className="h-3 w-1/2 bg-zinc-100 dark:bg-zinc-800 rounded" />
              <div className="h-3 w-2/3 bg-zinc-100 dark:bg-zinc-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
