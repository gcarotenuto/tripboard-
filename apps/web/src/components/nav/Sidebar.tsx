"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import useSWR from "swr";
import { cn } from "@tripboard/ui";

const TOP_NAV = [
  { href: "/trips", label: "Trip Hub", emoji: "🗺️" },
  { href: "/daily", label: "Daily Board", emoji: "☀️" },
  { href: "/archive", label: "Archive", emoji: "🗄️" },
];

const TRIP_SECTIONS = [
  { href: "timeline", label: "Timeline", emoji: "📅" },
  { href: "vault", label: "Vault", emoji: "🗄️" },
  { href: "journal", label: "Journal", emoji: "📓" },
  { href: "expenses", label: "Expenses", emoji: "💳" },
];

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((r) => r.data);

function TripSubNav({ tripId, pathname }: { tripId: string; pathname: string }) {
  const { data: trip } = useSWR<{ title: string } | null>(
    `/api/trips/${tripId}`,
    fetcher
  );

  return (
    <div className="mt-1 mb-2">
      {/* Trip name */}
      <Link
        href={`/trips/${tripId}`}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group"
      >
        <span className="text-xs font-semibold uppercase tracking-widest text-indigo-500 dark:text-indigo-400 truncate">
          {trip?.title ?? "…"}
        </span>
      </Link>
      {/* Section links */}
      <div className="ml-2 pl-3 border-l border-zinc-200 dark:border-zinc-700 space-y-0.5">
        {TRIP_SECTIONS.map((s) => {
          const href = `/trips/${tripId}/${s.href}`;
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={s.href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors",
                isActive
                  ? "bg-indigo-50 text-indigo-700 font-medium dark:bg-indigo-950/50 dark:text-indigo-400"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              )}
            >
              <span className="text-sm">{s.emoji}</span>
              {s.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const tripMatch = pathname.match(/^\/trips\/([a-f0-9-]{36})/);
  const activeTripId = tripMatch?.[1] ?? null;

  return (
    <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-6">
      {/* Logo */}
      <div className="px-5 mb-8">
        <Link href="/trips" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600">
            <span className="text-sm">✈️</span>
          </div>
          <span className="font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">TripBoard</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {TOP_NAV.map((item) => {
          const isActive = pathname === item.href ||
            (item.href === "/trips" && pathname.startsWith("/trips"));
          return (
            <div key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  isActive && item.href !== "/trips"
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400"
                    : item.href === "/trips" && pathname.startsWith("/trips")
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                )}
              >
                <span className="text-base">{item.emoji}</span>
                {item.label}
              </Link>
              {/* Trip sub-nav when inside a trip */}
              {item.href === "/trips" && activeTripId && (
                <TripSubNav tripId={activeTripId} pathname={pathname} />
              )}
            </div>
          );
        })}
      </nav>

      {/* Settings */}
      <div className="px-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-zinc-500 hover:bg-zinc-100 dark:text-zinc-500 dark:hover:bg-zinc-800 transition-colors"
        >
          <span className="text-base">⚙️</span>
          Settings
        </Link>
      </div>
    </aside>
  );
}
