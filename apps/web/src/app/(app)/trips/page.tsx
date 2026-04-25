import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { TripGrid } from "@/components/trips/TripGrid";
import { NewTripButton } from "@/components/trips/NewTripButton";
import { UserStatsStrip } from "@/components/trips/UserStatsStrip";

export const metadata: Metadata = { title: "Trip Hub" };

function getGreeting(): string {
  const hour = new Date().getUTCHours(); // server is UTC; close enough for greeting
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function TripsPage() {
  const session = await getServerSession(authOptions);
  const firstName = (session?.user as { name?: string })?.name?.split(" ")[0] ?? null;
  const greeting = getGreeting();

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            {firstName ? `${greeting}, ${firstName} ✈️` : "Trip Hub"}
          </h1>
          <p className="mt-0.5 text-sm text-zinc-400 dark:text-zinc-500">
            All your trips, planned and remembered.
          </p>
        </div>
        <NewTripButton />
      </div>
      <UserStatsStrip />
      <TripGrid />
    </div>
  );
}
