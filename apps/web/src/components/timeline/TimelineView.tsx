"use client";

import { LogisticsView } from "./LogisticsView";
import { MomentsView } from "./MomentsView";

interface TimelineViewProps {
  tripId: string;
  view: "logistics" | "moments";
}

export function TimelineView({ tripId, view }: TimelineViewProps) {
  if (view === "moments") {
    return <MomentsView tripId={tripId} />;
  }
  return <LogisticsView tripId={tripId} />;
}
