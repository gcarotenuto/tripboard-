import type { Metadata } from "next";
import { TimelineView } from "@/components/timeline/TimelineView";
import { ViewToggle } from "@/components/timeline/ViewToggle";
import { NewEventButton } from "@/components/timeline/NewEventButton";

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
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ViewToggle currentView={view} tripId={params.id} />
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {view === "logistics"
                ? "Flights, hotels, and transfers"
                : "Experiences, restaurants, and moments"}
            </p>
          </div>
          <NewEventButton tripId={params.id} defaultView={view} />
        </div>
      </div>

      {/* Dual timeline view */}
      <TimelineView tripId={params.id} view={view} />
    </div>
  );
}
