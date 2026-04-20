import type { Metadata } from "next";
import { TimelineView } from "@/components/timeline/TimelineView";
import { ViewToggle } from "@/components/timeline/ViewToggle";

export const metadata: Metadata = { title: "Timeline" };

interface TimelinePageProps {
  params: { id: string };
  searchParams: { view?: string };
}

export default function TimelinePage({ params, searchParams }: TimelinePageProps) {
  const view = (searchParams.view ?? "logistics") as "logistics" | "moments";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Timeline</h2>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            {view === "logistics"
              ? "Flights, hotels, and transfers"
              : "Experiences, restaurants, and moments"}
          </p>
        </div>
        <ViewToggle currentView={view} tripId={params.id} />
      </div>

      {/* Dual timeline view */}
      <TimelineView tripId={params.id} view={view} />
    </div>
  );
}
