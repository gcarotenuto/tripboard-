export default function JournalLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 animate-pulse">
      <div className="mb-8 flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-7 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
          <div className="h-4 w-36 bg-zinc-100 dark:bg-zinc-800 rounded" />
        </div>
        <div className="h-9 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
      </div>
      <div className="space-y-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-2">
            <div className="h-4 w-40 bg-zinc-200 dark:bg-zinc-700 rounded" />
            <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded" />
            <div className="h-3 w-5/6 bg-zinc-100 dark:bg-zinc-800 rounded" />
            <div className="h-3 w-3/4 bg-zinc-100 dark:bg-zinc-800 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
