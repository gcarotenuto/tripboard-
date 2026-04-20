import type { Metadata } from "next";
import Link from "next/link";
import { TripStats } from "@/components/trips/TripStats";
import { QuickActions } from "@/components/trips/QuickActions";

export const metadata: Metadata = { title: "Trip Overview" };

interface TripPageProps {
  params: { id: string };
}

const NAV_ITEMS = [
  { href: "timeline", label: "Timeline", emoji: "📅", description: "Logistics & moments" },
  { href: "vault", label: "Vault", emoji: "🗄️", description: "Documents & tickets" },
  { href: "journal", label: "Journal", emoji: "📓", description: "Notes & memories" },
  { href: "expenses", label: "Expenses", emoji: "💳", description: "Budget tracking" },
];

export default function TripOverviewPage({ params }: TripPageProps) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Trip header - populated by client component with SWR */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-zinc-400 dark:text-zinc-500 mb-3">
          <Link href="/trips" className="hover:text-zinc-600 dark:hover:text-zinc-300">
            Trips
          </Link>
          <span>/</span>
          <span className="text-zinc-600 dark:text-zinc-300">Japan Golden Week</span>
        </div>

        <div className="rounded-2xl border border-zinc-200/60 bg-gradient-to-br from-indigo-600/10 to-violet-600/5 dark:border-zinc-800 p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-800">
                  Upcoming
                </span>
              </div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                Japan Golden Week
              </h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Apr 25 – May 9, 2026 · Tokyo, Kyoto, Osaka, Hiroshima
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <TripStats tripId={params.id} />

      {/* Module navigation */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={`/trips/${params.id}/${item.href}`}
            className="group flex flex-col items-start rounded-2xl border border-zinc-200/60 bg-white p-4 hover:border-indigo-200 hover:bg-indigo-50/50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/30 transition-all"
          >
            <span className="text-2xl mb-2">{item.emoji}</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-700 dark:group-hover:text-indigo-400">
              {item.label}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">
              {item.description}
            </span>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <QuickActions tripId={params.id} />
    </div>
  );
}
