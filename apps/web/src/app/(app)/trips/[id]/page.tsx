import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TripStats } from "@/components/trips/TripStats";
import { QuickActions } from "@/components/trips/QuickActions";

export const metadata: Metadata = { title: "Trip Overview" };

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  PLANNING: { label: "Planning", className: "bg-zinc-100 text-zinc-600 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700" },
  UPCOMING: { label: "Upcoming", className: "bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-800" },
  ACTIVE: { label: "Active", className: "bg-emerald-100 text-emerald-800 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-800" },
  COMPLETED: { label: "Completed", className: "bg-indigo-100 text-indigo-800 ring-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:ring-indigo-800" },
};

const NAV_ITEMS = [
  { href: "timeline", label: "Timeline", emoji: "📅", description: "Logistics & moments" },
  { href: "vault", label: "Vault", emoji: "🗄️", description: "Documents & tickets" },
  { href: "journal", label: "Journal", emoji: "📓", description: "Notes & memories" },
  { href: "expenses", label: "Expenses", emoji: "💳", description: "Budget tracking" },
];

interface TripPageProps {
  params: { id: string };
}

export default async function TripOverviewPage({ params }: TripPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id: string }).id;
  const trip = await prisma.trip.findFirst({
    where: { id: params.id, userId, deletedAt: null },
  });

  if (!trip) notFound();

  const destinations: Array<{ city: string; country: string }> = JSON.parse(
    (trip.destinations as unknown as string) || "[]"
  );
  const destString = destinations.map((d) => d.city).join(", ") || trip.primaryDestination || "";

  const badge = STATUS_BADGE[trip.status] ?? STATUS_BADGE.PLANNING;

  const formatTripDate = (d: Date | null) =>
    d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null;

  const startStr = formatTripDate(trip.startsAt);
  const endStr = formatTripDate(trip.endsAt);
  const dateRange = startStr && endStr ? `${startStr} – ${endStr}` : startStr ?? "";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-zinc-400 dark:text-zinc-500 mb-6">
        <Link href="/trips" className="hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
          Trips
        </Link>
        <span>/</span>
        <span className="text-zinc-600 dark:text-zinc-300">{trip.title}</span>
      </div>

      {/* Trip header card */}
      <div className="rounded-2xl border border-zinc-200/60 bg-gradient-to-br from-indigo-600/10 to-violet-600/5 dark:border-zinc-800 p-6 mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${badge.className}`}>
            {badge.label}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          {trip.title}
        </h1>
        {(dateRange || destString) && (
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {[dateRange, destString].filter(Boolean).join(" · ")}
          </p>
        )}
        {trip.description && (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {trip.description}
          </p>
        )}
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
