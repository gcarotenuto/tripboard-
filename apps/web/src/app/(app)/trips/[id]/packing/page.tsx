import type { Metadata } from "next";
import { PackingView } from "@/components/packing/PackingView";

export const metadata: Metadata = { title: "Packing List" };

interface PackingPageProps {
  params: { id: string };
}

export default function PackingPage({ params }: PackingPageProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          🧳 Packing List
        </h2>
        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
          Track everything you need to bring on your trip.
        </p>
      </div>

      <PackingView tripId={params.id} />
    </div>
  );
}
