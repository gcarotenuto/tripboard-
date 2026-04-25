export default function TripOverviewLoading() {
  return (
    <div className="min-h-full animate-pulse">
      {/* Hero skeleton */}
      <div className="border-b border-zinc-200/60 dark:border-zinc-800 px-4 sm:px-6 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="h-3 w-16 bg-zinc-100 dark:bg-zinc-800 rounded mb-5" />
          <div className="h-4 w-20 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-3" />
          <div className="h-8 w-64 bg-zinc-200 dark:bg-zinc-700 rounded-lg mb-2" />
          <div className="h-4 w-48 bg-zinc-100 dark:bg-zinc-800 rounded" />
        </div>
      </div>
      {/* Content skeleton */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 h-20" />
          ))}
        </div>
        <div className="rounded-xl border border-zinc-200/60 dark:border-zinc-800 h-32" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-zinc-200/70 dark:border-zinc-800 h-28" />
          ))}
        </div>
      </div>
    </div>
  );
}
