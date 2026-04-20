"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@tripboard/ui";

const NAV_ITEMS = [
  { href: "/trips", label: "Trips", emoji: "🗺️" },
  { href: "/daily", label: "Today", emoji: "☀️" },
  { href: "/archive", label: "Archive", emoji: "🗄️" },
];

export function MobileNav() {
  const pathname = usePathname();

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
