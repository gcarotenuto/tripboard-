export default function ExpensesLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 animate-pulse">
      <div className="mb-6 flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-7 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
          <div className="h-4 w-44 bg-zinc-100 dark:bg-zinc-800 rounded" />
        </div>
        <div className="h-9 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
      </div>
      {/* Summary card skeleton */}
      <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 h-48 mb-6" />
      {/* List skeletons */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 h-16" />
        ))}
      </div>
    </div>
  );
}
