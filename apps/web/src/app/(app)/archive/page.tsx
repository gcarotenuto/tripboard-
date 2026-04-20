import type { Metadata } from "next";
import { ArchiveGrid } from "@/components/archive/ArchiveGrid";

export const metadata: Metadata = { title: "Archive" };

export default function ArchivePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Archive
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Your travel memory — every trip, permanently yours.
        </p>
      </div>

      {/* Archive grid */}
      <ArchiveGrid />
    </div>
  );
}
