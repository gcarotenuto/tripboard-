"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@tripboard/ui";
import { CalendarDays, Lock, BookOpen, CreditCard } from "lucide-react";

const NAV_ITEMS = [
  { href: "/trips", label: "Trips", emoji: "🗺️" },
  { href: "/daily", label: "Today", emoji: "☀️" },
  { href: "/archive", label: "Archive", emoji: "🗄️" },
];

const TRIP_SECTIONS = [
  { href: "timeline", label: "Timeline", Icon: CalendarDays },
  { href: "vault", label: "Vault", Icon: Lock },
  { href: "journal", label: "Journal", Icon: BookOpen },
  { href: "expenses", label: "Expenses", Icon: CreditCard },
];

export function MobileNav() {
  const pathname = usePathname();
  const tripMatch = pathname.match(/^\/trips\/([a-f0-9-]{36})/);
  const activeTripId = tripMatch?.[1] ?? null;

  // When inside a trip, show trip section nav instead of top-level nav
  if (activeTripId) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90 md:hidden">
        {/* Trip section tabs */}
        <div className="flex h-16 items-center justify-around">
          {/* Back to trips */}
          <Link
            href="/trips"
            className="flex flex-col items-center gap-0.5 px-3 py-2 text-xs font-medium text-zinc-500 dark:text-zinc-500"
          >
            <span className="text-xl">🗺️</span>
            <span>Trips</span>
          </Link>

          {TRIP_SECTIONS.map((section) => {
            const href = `/trips/${activeTripId}/${section.href}`;
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={section.href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-2 text-xs font-medium transition-colors",
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
    );
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90 md:hidden">
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
    </nav>
  );
}
