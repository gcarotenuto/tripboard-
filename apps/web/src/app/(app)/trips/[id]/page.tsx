import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TripStats } from "@/components/trips/TripStats";
import { TodayAgenda } from "@/components/trips/TodayAgenda";
import { QuickActions } from "@/components/trips/QuickActions";
import { WeatherWidget } from "@/components/weather/WeatherWidget";
import { CollaboratorsPanel } from "@/components/collaboration/CollaboratorsPanel";
import { ShareButton } from "@/components/trips/ShareButton";
import { TripActions } from "@/components/trips/TripActions";
import { AiItineraryButton } from "@/components/trips/AiItineraryButton";
import { AiPackingButton } from "@/components/packing/AiPackingButton";
import { CalendarDays, Lock, BookOpen, CreditCard, ArrowLeft, Printer, Calendar } from "lucide-react";

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

  const userId = (session.user as { id: string; name?: string; email?: string }).id;
  const userName = (session.user as { name?: string }).name ?? null;
  const userEmail = (session.user as { email?: string }).email ?? undefined;
  const trip = await prisma.trip.findFirst({
    where: { id: params.id, userId, deletedAt: null },
    select: {
      id: true, title: true, description: true, status: true,
      primaryDestination: true, destinations: true,
      startsAt: true, endsAt: true,
      isPublic: true, shareToken: true,
      tags: true,
    },
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

  // "Day X of Y" for active trips
  const tripDayInfo = (() => {
    if (trip.status !== "ACTIVE" || !trip.startsAt) return null;
    const start = new Date(trip.startsAt);
    start.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayNumber = Math.floor((today.getTime() - start.getTime()) / 86400000) + 1;
    if (dayNumber < 1) return null;
    const totalDays = trip.endsAt
      ? Math.floor((new Date(trip.endsAt).getTime() - start.getTime()) / 86400000) + 1
      : null;
    return { dayNumber, totalDays };
  })();

  return (
    <div className="min-h-full">
      {/* Hero section */}
      <div className={`relative bg-gradient-to-b ${heroGradient} border-b border-zinc-200/60 dark:border-zinc-800 overflow-hidden`}>
        {/* Animated ambient blob for ACTIVE trips */}
        {trip.status === "ACTIVE" && (
          <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-emerald-400/10 dark:bg-emerald-500/10 blur-3xl animate-hero-glow pointer-events-none" />
        )}
        {/* Ghost text */}
        <div className="absolute inset-0 flex items-center justify-end pr-8 pointer-events-none overflow-hidden">
          <span className="text-[8rem] font-black tracking-tighter text-zinc-900/[0.04] dark:text-zinc-100/[0.04] select-none leading-none animate-hero-glow">
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
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${badge.className}`}>
                  {badge.label}
                </span>
                {tripDayInfo && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 ring-1 ring-inset ring-emerald-200 dark:ring-emerald-800">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    </span>
                    Day {tripDayInfo.dayNumber}{tripDayInfo.totalDays ? ` of ${tripDayInfo.totalDays}` : ""}
                  </span>
                )}
              </div>
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
              {/* Tags */}
              {(() => {
                const tags = JSON.parse((trip.tags as unknown as string) || "[]") as string[];
                return tags.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-white/60 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 backdrop-blur-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null;
              })()}
            </div>
            <TripActions
              tripId={trip.id}
              tripData={{
                title: trip.title,
                description: trip.description,
                primaryDestination: trip.primaryDestination,
                status: trip.status,
                startsAt: trip.startsAt,
                endsAt: trip.endsAt,
                tags: JSON.parse((trip.tags as unknown as string) || "[]") as string[],
              }}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-8">
        {/* Stats */}
        <TripStats tripId={params.id} />

        {/* Today's Agenda — only visible on ACTIVE trips */}
        <TodayAgenda tripId={params.id} tripStatus={trip.status} />

        {/* Weather */}
        <WeatherWidget tripId={params.id} />

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

        {/* AI Assistant */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-3">
            AI Assistant
          </p>
          <div className="rounded-2xl border border-indigo-100 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50/60 to-violet-50/60 dark:from-indigo-950/20 dark:to-violet-950/20 divide-y divide-indigo-100/60 dark:divide-indigo-900/40 overflow-hidden">
            <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Generate itinerary</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  AI plans your day-by-day schedule based on your destination.
                </p>
              </div>
              <AiItineraryButton tripId={params.id} />
            </div>
            <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Suggest packing list</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  AI generates destination-specific packing items for your trip.
                </p>
              </div>
              <AiPackingButton tripId={params.id} />
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <QuickActions tripId={params.id} />

        {/* Collaborators */}
        <CollaboratorsPanel
          tripId={params.id}
          isOwner={true}
          ownerName={userName}
          ownerEmail={userEmail}
        />

        {/* Share + Export */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <ShareButton
            tripId={params.id}
            initialToken={trip.shareToken}
            initialPublic={trip.isPublic}
          />
          <a
            href={`/api/trips/${params.id}/ical`}
            download
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-200 transition-all"
          >
            <Calendar className="h-4 w-4" />
            Export iCal
          </a>
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
