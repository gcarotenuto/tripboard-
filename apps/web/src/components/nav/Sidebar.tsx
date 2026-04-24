"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import { cn } from "@tripboard/ui";
import {
  Map,
  Sun,
  Archive,
  Settings,
  CalendarDays,
  Lock,
  BookOpen,
  CreditCard,
  ChevronRight,
  Plane,
  Search,
  Luggage,
  MapPin,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { SearchModal } from "@/components/search/SearchModal";
import { NotificationToggle } from "@/components/pwa/NotificationToggle";
import { ThemeToggle } from "@/components/pwa/ThemeToggle";

const TOP_NAV = [
  { href: "/trips", label: "Trip Hub", Icon: Map },
  { href: "/daily", label: "Daily Board", Icon: Sun },
  { href: "/archive", label: "Archive", Icon: Archive },
];

const TRIP_SECTIONS = [
  { href: "timeline", label: "Timeline", Icon: CalendarDays },
  { href: "vault", label: "Vault", Icon: Lock },
  { href: "journal", label: "Journal", Icon: BookOpen },
  { href: "expenses", label: "Expenses", Icon: CreditCard },
  { href: "packing", label: "Packing", Icon: Luggage },
  { href: "map", label: "Map", Icon: MapPin },
];

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((r) => r.data);

function TripSubNav({ tripId, pathname }: { tripId: string; pathname: string }) {
  const { data: trip } = useSWR<{ title: string } | null>(`/api/trips/${tripId}`, fetcher);

  return (
    <div className="mt-1 mb-1">
      {/* Trip name pill */}
      <Link
        href={`/trips/${tripId}`}
        className="mx-2 mb-1 flex items-center gap-1.5 rounded-lg px-2 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group"
      >
        <ChevronRight className="h-3 w-3 text-zinc-400 dark:text-zinc-600 shrink-0" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 truncate">
          {trip?.title ?? "…"}
        </span>
      </Link>
      {/* Section links */}
      <div className="ml-3 pl-3 border-l-2 border-zinc-100 dark:border-zinc-800 space-y-0.5">
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
                  ? "bg-indigo-50 text-indigo-700 font-medium dark:bg-indigo-950/60 dark:text-indigo-300"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-500 dark:hover:bg-zinc-800/70 dark:hover:text-zinc-200"
              )}
            >
              <s.Icon
                className={cn(
                  "h-3.5 w-3.5 shrink-0",
                  isActive ? "text-indigo-500" : "text-zinc-400 dark:text-zinc-600"
                )}
              />
              <span className="text-xs font-medium">{s.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const tripMatch = pathname.match(/^\/trips\/([a-f0-9-]{36})/);
  const activeTripId = tripMatch?.[1] ?? null;
  const [searchOpen, setSearchOpen] = useState(false);

  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  // Cmd+K / Ctrl+K global shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const user = session?.user as { name?: string; email?: string } | undefined;
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <>
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-5">
      {/* Logo */}
      <div className="px-4 mb-6">
        <Link href="/trips" className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm shadow-indigo-500/30">
            <Plane className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-[15px] text-zinc-900 dark:text-zinc-100 tracking-tight">
            TripBoard
          </span>
        </Link>
      </div>

      {/* Search button */}
      <div className="px-2 mb-3">
        <button
          onClick={openSearch}
          className="flex w-full items-center gap-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-400 dark:text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">Search…</span>
          <kbd className="inline-flex items-center rounded border border-zinc-200 dark:border-zinc-700 px-1.5 py-0.5 text-[10px] font-medium">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {TOP_NAV.map((item) => {
          const isTripHubActive = item.href === "/trips" && pathname.startsWith("/trips");
          const isActive = pathname === item.href || isTripHubActive;

          return (
            <div key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/70 dark:hover:text-zinc-200"
                )}
              >
                <item.Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isActive ? "text-indigo-500 dark:text-indigo-400" : "text-zinc-400 dark:text-zinc-600"
                  )}
                />
                {item.label}
              </Link>

              {/* Trip sub-nav */}
              {item.href === "/trips" && activeTripId && (
                <TripSubNav tripId={activeTripId} pathname={pathname} />
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom: Settings + Notifications + User */}
      <div className="px-2 pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-0.5">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-zinc-500 hover:bg-zinc-100 dark:text-zinc-500 dark:hover:bg-zinc-800/70 transition-colors"
        >
          <Settings className="h-4 w-4 text-zinc-400 dark:text-zinc-600" />
          Settings
        </Link>
        <ThemeToggle />
        <NotificationToggle />

        {/* User profile + logout */}
        {user && (
          <div className="flex items-center gap-2 px-3 py-2 mt-1">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-white">{initials}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate leading-tight">
                {user.name ?? "Traveler"}
              </p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-600 truncate leading-tight">
                {user.email}
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              title="Sign out"
              className="shrink-0 p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-950/30 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>

    <SearchModal open={searchOpen} onClose={closeSearch} />
    </>
  );
}
