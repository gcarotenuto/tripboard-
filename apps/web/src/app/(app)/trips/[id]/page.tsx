import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TripStats } from "@/components/trips/TripStats";
import { QuickActions } from "@/components/trips/QuickActions";
import { CalendarDays, Lock, BookOpen, CreditCard, ArrowLeft, Printer } from "lucide-react";

export const metadata: Metadata = { title: "Trip Overview" };

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  PLANNING: { label: "Planning", className: "bg-zinc-100 text-zinc-600 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700" },
  UPCOMING: { label: "Upcoming", className: "bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-800" },
  ACTIVE: { label: "Active now", className: "bg-emerald-100 text-emerald-800 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-800" },
  COMPLETED: { label: "Completed", className: "bg-indigo-100 text-indigo-800 ring-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:ring-indigo-800" },
};

function getHeroGradient(dest: string, status: string): string {
  const d = dest.toLowerCase();
  if (status === "ACTIVE") return "from-emerald-500/20 via-teal-500/10 to-transparent";
  if (d.includes("japan") || d.includes("tokyo")) return "from-rose-500/20 via-pink-500/10 to-transparent";
  if (d.includes("morocco") || d.includes("marrakech")) return "from-orange-500/20 via-amber-500/10 to-transparent";
  if (d.includes("new york") || d.includes("usa")) return "from-sky-500/20 via-blue-500/10 to-transparent";
  if (d.includes("lisbon") || d.includes("portugal")) return "from-yellow-500/20 via-amber-400/10 to-transparent";
  if (d.includes("rome") || d.includes("italy") || d.includes("amalfi")) return "from-amber-500/20 via-yellow-400/10 to-transparent";
  if (status === "UPCOMING") return "from-amber-500/15 via-orange-400/10 to-transparent";
  if (status === "COMPLETED") return "from-indigo-500/20 via-violet-500/10 to-transparent";
  return "from-indigo-500/15 via-violet-400/10 to-transparent";
}

const NAV_ITEMS = [
  { href: "timeline", label: "Timeline", Icon: CalendarDays, description: "Bookings & moments" },
  { href: "vault", label: "Vault", Icon: Lock, description: "Documents & tickets" },
  { href: "journal", label: "Journal", Icon: BookOpen, description: "Notes & memories" },
  { href: "expenses", label: "Expenses", Icon: CreditCard, description: "Budget & spending" },
];

interface TripPageProps { params: { id: string } }

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
  const ghostText = (trip.primaryDestination ?? "").split(",")[0]?.toUpperCase() ?? "";
  const badge = STATUS_BADGE[trip.status] ?? STATUS_BADGE.PLANNING;
  const heroGradient = getHeroGradient(trip.primaryDestination ?? "", trip.status);

  const formatTripDate = (d: Date | null) =>
    d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null;

  const startStr = formatTripDate(trip.startsAt);
  const endStr = formatTripDate(trip.endsAt);
  const dateRange = startStr && endStr ? `${startStr} – ${endStr}` : startStr ?? "";

  return (
    <div className="min-h-full">
      {/* Hero section */}
      <div className={`relative bg-gradient-to-b ${heroGradient} border-b border-zinc-200/60 dark:border-zinc-800 overflow-hidden`}>
        {/* Ghost text */}
        <div className="absolute inset-0 flex items-center justify-end pr-8 pointer-events-none overflow-hidden">
          <span className="text-[8rem] font-black tracking-tighter text-zinc-900/[0.04] dark:text-zinc-100/[0.04] select-none leading-none">
            {ghostText}
          </span>
        </div>

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 py-8">
          {/* Breadcrumb */}
          <Link
            href="/trips"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors mb-5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All trips
          </Link>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset mb-3 ${badge.className}`}>
                {badge.label}
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight break-words">
                {trip.title}
              </h1>
              {(dateRange || destString) && (
                <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                  {[dateRange, destString].filter(Boolean).join(" · ")}
                </p>
              )}
              {trip.description && (
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl">
                  {trip.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-8">
        {/* Stats */}
        <TripStats tripId={params.id} />

        {/* Module nav */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-3">
            Navigate
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={`/trips/${params.id}/${item.href}`}
                className="group flex flex-col gap-3 rounded-2xl border border-zinc-200/70 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-4 hover:border-indigo-300 hover:bg-indigo-50/40 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/30 transition-all"
              >
                <div className="h-8 w-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
                  <item.Icon className="h-4 w-4 text-zinc-500 dark:text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">
                    {item.label}
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-0.5">{item.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <QuickActions tripId={params.id} />

        {/* Export */}
        <div className="flex justify-end pt-2">
          <Link
            href={`/trips/${params.id}/print`}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-200 transition-all"
          >
            <Printer className="h-4 w-4" />
            Export PDF
          </Link>
        </div>
      </div>
    </div>
  );
}
