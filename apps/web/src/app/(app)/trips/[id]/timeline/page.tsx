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

  const subtitle = view === "logistics"
    ? "Bookings, confirmations, and transfers — your execution checklist."
    : "What you experienced, felt, and captured — your travel story.";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <ViewToggle currentView={view} tripId={params.id} />
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs">
            {subtitle}
          </p>
        </div>
        <NewEventButton tripId={params.id} defaultView={view} />
      </div>

      <TimelineView tripId={params.id} view={view} />
    </div>
  );
}
