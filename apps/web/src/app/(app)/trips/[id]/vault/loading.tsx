export default function VaultLoading() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8 animate-pulse">
      <div className="mb-8 flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-7 w-36 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
          <div className="h-4 w-56 bg-zinc-100 dark:bg-zinc-800 rounded" />
        </div>
        <div className="h-9 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
      </div>
      <div className="grid grid-cols-3 gap-3 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-zinc-200/60 dark:border-zinc-800 h-16" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 h-20" />
        ))}
      </div>
    </div>
  );
}
