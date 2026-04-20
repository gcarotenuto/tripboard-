import type { Metadata } from "next";
import { TripGrid } from "@/components/trips/TripGrid";
import { NewTripButton } from "@/components/trips/NewTripButton";

export const metadata: Metadata = { title: "Trip Hub" };

export default function TripsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
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

      {/* Status filter tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {(["All", "Upcoming", "Active", "Planning", "Completed"] as const).map((tab) => (
          <button
            key={tab}
            className="whitespace-nowrap rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-sm font-medium text-zinc-600 hover:border-indigo-300 hover:text-indigo-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Trip grid */}
      <TripGrid />
    </div>
  );
}
