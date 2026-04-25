export default function MapLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 animate-pulse">
      <div className="mb-6 space-y-2">
        <div className="h-7 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
        <div className="h-4 w-56 bg-zinc-100 dark:bg-zinc-800 rounded" />
      </div>
      <div className="h-[400px] w-full rounded-xl bg-zinc-100 dark:bg-zinc-800" />
    </div>
  );
}
