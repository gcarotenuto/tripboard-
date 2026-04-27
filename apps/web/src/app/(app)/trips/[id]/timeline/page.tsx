import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TimelineView } from "@/components/timeline/TimelineView";
import { ViewToggle } from "@/components/timeline/ViewToggle";
import { NewEventButton } from "@/components/timeline/NewEventButton";
import { CalendarDays } from "lucide-react";

interface TimelinePageProps {
  params: { id: string };
  searchParams: { view?: string };
}

export async function generateMetadata({ params }: TimelinePageProps): Promise<Metadata> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { title: "Timeline" };
  const userId = (session.user as { id: string }).id;
  const trip = await prisma.trip.findFirst({
    where: { id: params.id, userId, deletedAt: null },
    select: { title: true },
  });
  return { title: trip ? `${trip.title} — Timeline` : "Timeline" };
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
        <div className="flex items-center gap-2">
          <a
            href={`/api/trips/${params.id}/ical`}
            title="Add all events to your calendar app"
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-700 dark:hover:text-zinc-200 transition-all"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            .ics
          </a>
          <NewEventButton tripId={params.id} defaultView={view} />
        </div>
      </div>

      <TimelineView tripId={params.id} view={view} />
    </div>
  );
}
