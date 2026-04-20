"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@tripboard/ui";

const NAV_ITEMS = [
  { href: "/trips", label: "Trip Hub", emoji: "🗺️" },
  { href: "/daily", label: "Daily Board", emoji: "☀️" },
  { href: "/archive", label: "Archive", emoji: "🗄️" },
];

export function Sidebar() {
  const pathname = usePathname();

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
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              )}
            >
              <span className="text-base">{item.emoji}</span>
              {item.label}
            </Link>
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
