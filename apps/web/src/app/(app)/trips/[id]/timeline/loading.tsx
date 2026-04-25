export default function TimelineLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 animate-pulse">
      <div className="mb-6 flex items-start justify-between">
        <div className="h-8 w-40 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
        <div className="h-9 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-zinc-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 h-20" />
        ))}
      </div>
    </div>
  );
}
