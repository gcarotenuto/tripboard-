import type { Metadata } from "next";
import { TripGrid } from "@/components/trips/TripGrid";
import { NewTripButton } from "@/components/trips/NewTripButton";

export const metadata: Metadata = { title: "Trip Hub" };

export default function TripsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Trip Hub
          </h1>
          <p className="mt-0.5 text-sm text-zinc-400 dark:text-zinc-500">
            All your trips, planned and remembered.
          </p>
        </div>
        <NewTripButton />
      </div>
      <TripGrid />
    </div>
  );
}
