"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Search, Map, CalendarDays, CreditCard, BookOpen, X, ArrowRight, Sun, Archive, Settings } from "lucide-react";

interface TripResult {
  id: string;
  title: string;
  primaryDestination: string | null;
  status: string;
}

interface EventResult {
  id: string;
  tripId: string;
  title: string;
  type: string;
  startsAt: string | null;
}

interface ExpenseResult {
  id: string;
  tripId: string;
  title: string;
  amount: number;
  currency: string;
}

interface JournalResult {
  id: string;
  tripId: string;
  title: string | null;
  entryDate: string | null;
}

interface SearchResults {
  trips: TripResult[];
  events: EventResult[];
  expenses: ExpenseResult[];
  journal: JournalResult[];
}

interface FlatResult {
  id: string;
  href: string;
  label: string;
  sub?: string;
  section: string;
  icon: React.ReactNode;
}

interface TripSummaryMin {
  id: string;
  title: string;
  primaryDestination: string | null;
  status: string;
}

const tripFetcher = (url: string) => fetch(url).then((r) => r.json()).then((r) => r.data);

const QUICK_LINKS = [
  { href: "/trips",   label: "Trip Hub",     icon: <Map className="h-3.5 w-3.5" />,      bg: "bg-indigo-50 dark:bg-indigo-950/50",   color: "text-indigo-600 dark:text-indigo-400" },
  { href: "/daily",   label: "Daily Board",  icon: <Sun className="h-3.5 w-3.5" />,      bg: "bg-amber-50 dark:bg-amber-950/50",    color: "text-amber-600 dark:text-amber-400" },
  { href: "/archive", label: "Archive",      icon: <Archive className="h-3.5 w-3.5" />,  bg: "bg-violet-50 dark:bg-violet-950/50",  color: "text-violet-600 dark:text-violet-400" },
  { href: "/settings",label: "Settings",     icon: <Settings className="h-3.5 w-3.5" />, bg: "bg-zinc-50 dark:bg-zinc-800",         color: "text-zinc-600 dark:text-zinc-400" },
];

const STATUS_EMOJI: Record<string, string> = {
  ACTIVE: "🟢", UPCOMING: "🟡", PLANNING: "⚪", COMPLETED: "✅", ARCHIVED: "📦",
};

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

const SECTION_ICONS: Record<string, React.ReactNode> = {
  Trips:    <Map className="h-3.5 w-3.5 text-indigo-500" />,
  Events:   <CalendarDays className="h-3.5 w-3.5 text-amber-500" />,
  Expenses: <CreditCard className="h-3.5 w-3.5 text-emerald-500" />,
  Journal:  <BookOpen className="h-3.5 w-3.5 text-violet-500" />,
};

const SECTION_ICON_BG: Record<string, string> = {
  Trips:    "bg-indigo-50 dark:bg-indigo-950/50",
  Events:   "bg-amber-50 dark:bg-amber-950/50",
  Expenses: "bg-emerald-50 dark:bg-emerald-950/50",
  Journal:  "bg-violet-50 dark:bg-violet-950/50",
};

export function SearchModal({ open, onClose }: SearchModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Pull trips from SWR cache (free — already loaded on /trips page)
  const { data: recentTrips } = useSWR<TripSummaryMin[]>("/api/trips", tripFetcher);

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 280);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch
  useEffect(() => {
    if (debouncedQuery.length < 2) { setResults(null); setSelectedIndex(-1); return; }
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then((r) => { setResults(r.data ?? null); setSelectedIndex(-1); setLoading(false); })
      .catch(() => setLoading(false));
  }, [debouncedQuery]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 40);
      setQuery("");
      setResults(null);
      setSelectedIndex(-1);
    }
  }, [open]);

  // Flatten results for keyboard nav
  const flatResults = useMemo<FlatResult[]>(() => {
    if (!results) return [];
    const items: FlatResult[] = [];

    results.trips.forEach((t) => items.push({
      id: t.id, href: `/trips/${t.id}`, label: t.title,
      sub: t.primaryDestination ?? undefined, section: "Trips",
      icon: SECTION_ICONS.Trips,
    }));

    results.events.forEach((e) => items.push({
      id: e.id, href: `/trips/${e.tripId}/timeline`, label: e.title,
      sub: e.type.charAt(0) + e.type.slice(1).toLowerCase(), section: "Events",
      icon: SECTION_ICONS.Events,
    }));

    results.expenses.forEach((e) => items.push({
      id: e.id, href: `/trips/${e.tripId}/expenses`, label: e.title,
      sub: `${e.currency} ${Number(e.amount).toFixed(2)}`, section: "Expenses",
      icon: SECTION_ICONS.Expenses,
    }));

    results.journal.forEach((e) => items.push({
      id: e.id, href: `/trips/${e.tripId}/journal`, label: e.title ?? "Untitled entry",
      sub: e.entryDate ? new Date(e.entryDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : undefined,
      section: "Journal", icon: SECTION_ICONS.Journal,
    }));

    return items;
  }, [results]);

  // Auto-scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedIndex]);

  const navigate = useCallback((href: string) => {
    onClose();
    router.push(href);
  }, [onClose, router]);

  // Keyboard handler on input
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (flatResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, flatResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < flatResults.length) {
        navigate(flatResults[selectedIndex].href);
      }
    }
  }, [flatResults, selectedIndex, navigate]);

  // ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const hasResults = flatResults.length > 0;

  // Group flat results by section for rendering
  type SectionGroup = { label: string; items: Array<FlatResult & { flatIdx: number }> };
  const sections = useMemo<SectionGroup[]>(() => {
    const map: Record<string, Array<FlatResult & { flatIdx: number }>> = {};
    flatResults.forEach((item, i) => {
      if (!map[item.section]) map[item.section] = [];
      map[item.section].push({ ...item, flatIdx: i });
    });
    return Object.entries(map).map(([label, items]) => ({ label, items }));
  }, [flatResults]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh] px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl shadow-black/25 border border-zinc-200/70 dark:border-zinc-800 overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-100 dark:border-zinc-800">
          <Search className="h-4 w-4 shrink-0 text-zinc-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search trips, events, expenses, journal…"
            className="flex-1 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none"
            autoComplete="off"
            spellCheck={false}
          />
          <div className="flex items-center gap-1.5 shrink-0">
            {query && (
              <button onClick={() => { setQuery(""); setSelectedIndex(-1); }} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors p-0.5">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center rounded border border-zinc-200 dark:border-zinc-700 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
              ESC
            </kbd>
          </div>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto overscroll-contain">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-zinc-400">
              <span className="h-4 w-4 border-2 border-zinc-300 border-t-indigo-500 rounded-full animate-spin" />
              Searching…
            </div>
          )}

          {!loading && query.length >= 2 && !hasResults && (
            <div className="py-10 text-center text-sm text-zinc-400">
              No results for &ldquo;<span className="text-zinc-600 dark:text-zinc-300">{query}</span>&rdquo;
            </div>
          )}

          {!loading && query.length < 2 && (
            <div className="py-3">
              {/* Quick navigation */}
              <div className="px-4 pt-1 pb-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-600 mb-2">Navigate</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {QUICK_LINKS.map((link) => (
                    <button
                      key={link.href}
                      onClick={() => { onClose(); router.push(link.href); }}
                      className={`flex flex-col items-center gap-1.5 rounded-xl py-3 px-2 transition-colors hover:opacity-80 ${link.bg}`}
                    >
                      <span className={link.color}>{link.icon}</span>
                      <span className={`text-[10px] font-semibold ${link.color}`}>{link.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent trips */}
              {recentTrips && recentTrips.length > 0 && (
                <div className="mt-2">
                  <div className="px-4 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-600">Your trips</p>
                  </div>
                  {recentTrips.slice(0, 5).map((trip) => (
                    <button
                      key={trip.id}
                      onClick={() => { onClose(); router.push(`/trips/${trip.id}`); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-left transition-colors"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-sm">
                        {STATUS_EMOJI[trip.status] ?? "✈️"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{trip.title}</p>
                        {trip.primaryDestination && (
                          <p className="text-xs text-zinc-400 truncate">{trip.primaryDestination}</p>
                        )}
                      </div>
                      <ArrowRight className="h-3 w-3 text-zinc-300 dark:text-zinc-700 shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              <div className="px-4 pt-3 pb-1 border-t border-zinc-100 dark:border-zinc-800 mt-2">
                <p className="text-[11px] text-zinc-400 dark:text-zinc-600 text-center">
                  Type to search trips, events, expenses &amp; journal
                </p>
              </div>
            </div>
          )}

          {!loading && hasResults && (
            <div className="py-2">
              {sections.map((section) => (
                <div key={section.label} className="mb-1 last:mb-0">
                  {/* Section header */}
                  <div className="px-4 pt-2 pb-1 flex items-center gap-2">
                    <div className={`flex h-5 w-5 items-center justify-center rounded-md ${SECTION_ICON_BG[section.label]}`}>
                      {SECTION_ICONS[section.label]}
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-600">
                      {section.label}
                    </span>
                  </div>

                  {/* Items */}
                  {section.items.map((item) => {
                    const isSelected = item.flatIdx === selectedIndex;
                    return (
                      <button
                        key={item.id}
                        ref={(el) => { itemRefs.current[item.flatIdx] = el; }}
                        onClick={() => navigate(item.href)}
                        onMouseEnter={() => setSelectedIndex(item.flatIdx)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                          isSelected
                            ? "bg-indigo-50 dark:bg-indigo-950/40"
                            : "hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                        }`}
                      >
                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${SECTION_ICON_BG[item.section]}`}>
                          {item.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-medium truncate ${isSelected ? "text-indigo-700 dark:text-indigo-300" : "text-zinc-900 dark:text-zinc-100"}`}>
                            {item.label}
                          </p>
                          {item.sub && (
                            <p className="text-xs text-zinc-400 truncate mt-0.5">{item.sub}</p>
                          )}
                        </div>
                        {isSelected && (
                          <ArrowRight className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        {hasResults && (
          <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-2 flex items-center gap-4">
            <span className="text-[11px] text-zinc-400 dark:text-zinc-600 flex items-center gap-1">
              <kbd className="rounded border border-zinc-200 dark:border-zinc-700 px-1 py-0.5 text-[10px]">↑↓</kbd> navigate
            </span>
            <span className="text-[11px] text-zinc-400 dark:text-zinc-600 flex items-center gap-1">
              <kbd className="rounded border border-zinc-200 dark:border-zinc-700 px-1 py-0.5 text-[10px]">↵</kbd> open
            </span>
            <span className="text-[11px] text-zinc-400 dark:text-zinc-600 ml-auto">{flatResults.length} result{flatResults.length !== 1 ? "s" : ""}</span>
          </div>
        )}
      </div>
    </div>
  );
}
