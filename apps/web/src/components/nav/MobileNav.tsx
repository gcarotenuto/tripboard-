"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useCallback, useEffect } from "react";
import { cn } from "@tripboard/ui";
import { CalendarDays, Lock, BookOpen, CreditCard, Luggage, MapPin, Settings, Search } from "lucide-react";
import { SearchModal } from "@/components/search/SearchModal";

const NAV_ITEMS = [
  { href: "/trips",   label: "Trips",   emoji: "🗺️" },
  { href: "/daily",   label: "Today",   emoji: "☀️" },
  { href: "/archive", label: "Archive", emoji: "🗄️" },
];

const TRIP_SECTIONS = [
  { href: "timeline", label: "Timeline", Icon: CalendarDays },
  { href: "vault",    label: "Vault",    Icon: Lock },
  { href: "journal",  label: "Journal",  Icon: BookOpen },
  { href: "expenses", label: "Expenses", Icon: CreditCard },
  { href: "packing",  label: "Packing",  Icon: Luggage },
  { href: "map",      label: "Map",      Icon: MapPin },
];

export function MobileNav() {
  const pathname = usePathname();
  const tripMatch = pathname.match(/^\/trips\/([a-f0-9-]{36})/);
  const activeTripId = tripMatch?.[1] ?? null;
  const [searchOpen, setSearchOpen] = useState(false);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  // Cmd+K global shortcut (mobile too)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((p) => !p);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Inside a trip: show trip section nav
  if (activeTripId) {
    const isOverview = pathname === `/trips/${activeTripId}`;
    return (
      <>
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 bg-white/95 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95 md:hidden safe-bottom">
          <div className="flex h-16 items-center overflow-x-auto scrollbar-none">
            {/* Back to all trips */}
            <Link
              href="/trips"
              className="flex flex-col items-center gap-0.5 px-3 py-2 text-xs font-medium text-zinc-400 dark:text-zinc-600 shrink-0"
            >
              <span className="text-xl">←</span>
              <span>Hub</span>
            </Link>

            {/* Divider */}
            <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800 shrink-0" />

            {/* Trip overview */}
            <Link
              href={`/trips/${activeTripId}`}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-2 text-xs font-medium transition-colors shrink-0",
                isOverview ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-500 dark:text-zinc-500"
              )}
            >
              <span className="text-xl">✈️</span>
              <span>Overview</span>
            </Link>

            {/* Divider */}
            <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800 shrink-0" />

            {TRIP_SECTIONS.map((section) => {
              const href = `/trips/${activeTripId}/${section.href}`;
              const isActive = pathname.startsWith(href);
              return (
                <Link
                  key={section.href}
                  href={href}
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-4 py-2 text-xs font-medium transition-colors shrink-0",
                    isActive
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-zinc-500 dark:text-zinc-500"
                  )}
                >
                  <section.Icon
                    className={cn(
                      "h-5 w-5",
                      isActive ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400 dark:text-zinc-600"
                    )}
                  />
                  <span>{section.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
        <SearchModal open={searchOpen} onClose={closeSearch} />
      </>
    );
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-zinc-200 bg-white/95 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95 md:hidden safe-bottom">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-2 text-xs font-medium transition-colors",
                isActive
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-zinc-500 dark:text-zinc-500"
              )}
            >
              <span className="text-xl">{item.emoji}</span>
              {item.label}
            </Link>
          );
        })}

        {/* Search button */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex flex-col items-center gap-0.5 px-4 py-2 text-xs font-medium text-zinc-500 dark:text-zinc-500 transition-colors active:text-indigo-600"
        >
          <Search className="h-5 w-5 text-zinc-400 dark:text-zinc-600" />
          <span>Search</span>
        </button>

        {/* Settings */}
        <Link
          href="/settings"
          className={cn(
            "flex flex-col items-center gap-0.5 px-4 py-2 text-xs font-medium transition-colors",
            pathname === "/settings"
              ? "text-indigo-600 dark:text-indigo-400"
              : "text-zinc-500 dark:text-zinc-500"
          )}
        >
          <Settings className={cn("h-5 w-5", pathname === "/settings" ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400 dark:text-zinc-600")} />
          <span>Settings</span>
        </Link>
      </nav>
      <SearchModal open={searchOpen} onClose={closeSearch} />
    </>
  );
}
