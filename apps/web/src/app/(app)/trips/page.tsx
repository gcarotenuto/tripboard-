import type { Metadata } from "next";
import { TripGrid } from "@/components/trips/TripGrid";
import { NewTripButton } from "@/components/trips/NewTripButton";

export const metadata: Metadata = { title: "Trip Hub" };

export default function TripsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Trip Hub
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            All your trips, in one place.
          </p>
        </div>
        <NewTripButton />
      </div>
      <TripGrid />
    </div>
  );
}
