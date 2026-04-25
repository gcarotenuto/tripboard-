export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 animate-pulse">
      <div className="mb-8 space-y-2">
        <div className="h-7 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
        <div className="h-4 w-56 bg-zinc-100 dark:bg-zinc-800 rounded" />
      </div>

      {/* Appearance card */}
      <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 mb-6">
        <div className="h-5 w-24 bg-zinc-200 dark:bg-zinc-700 rounded mb-4" />
        <div className="flex items-center justify-between">
          <div className="h-4 w-16 bg-zinc-100 dark:bg-zinc-800 rounded" />
          <div className="h-8 w-20 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
        </div>
      </div>

      {/* Settings sections */}
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 mb-6 space-y-4">
          <div className="h-5 w-32 bg-zinc-200 dark:bg-zinc-700 rounded" />
          {Array.from({ length: 3 }).map((_, j) => (
            <div key={j} className="space-y-1.5">
              <div className="h-3 w-20 bg-zinc-100 dark:bg-zinc-800 rounded" />
              <div className="h-10 w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
            </div>
          ))}
          <div className="h-9 w-24 bg-zinc-200 dark:bg-zinc-700 rounded-xl" />
        </div>
      ))}
    </div>
  );
}
