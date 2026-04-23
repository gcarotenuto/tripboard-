"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Map, CalendarDays, CreditCard, BookOpen, X } from "lucide-react";

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

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch results
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then((r) => {
        setResults(r.data ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [debouncedQuery]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults(null);
    }
  }, [open]);

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const navigate = useCallback(
    (href: string) => {
      onClose();
      router.push(href);
    },
    [onClose, router]
  );

  const hasResults =
    results &&
    (results.trips.length > 0 ||
      results.events.length > 0 ||
      results.expenses.length > 0 ||
      results.journal.length > 0);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl shadow-black/20 border border-zinc-200/70 dark:border-zinc-800 overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
          <Search className="h-4 w-4 shrink-0 text-zinc-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search trips, events, expenses, journal…"
            className="flex-1 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center rounded border border-zinc-200 dark:border-zinc-700 px-1.5 py-0.5 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {loading && (
            <div className="py-8 text-center text-sm text-zinc-400">Searching…</div>
          )}

          {!loading && query.length >= 2 && !hasResults && (
            <div className="py-8 text-center text-sm text-zinc-400">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}

          {!loading && query.length < 2 && (
            <div className="py-8 text-center text-sm text-zinc-400">
              Type at least 2 characters to search
            </div>
          )}

          {!loading && hasResults && (
            <div className="py-2">
              {/* Trips */}
              {results.trips.length > 0 && (
                <section className="mb-1">
                  <div className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-600">
                    Trips
                  </div>
                  {results.trips.map((trip) => (
                    <button
                      key={trip.id}
                      onClick={() => navigate(`/trips/${trip.id}`)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/50">
                        <Map className="h-3.5 w-3.5 text-indigo-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                          {trip.title}
                        </p>
                        {trip.primaryDestination && (
                          <p className="text-xs text-zinc-400 truncate">{trip.primaryDestination}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </section>
              )}

              {/* Events */}
              {results.events.length > 0 && (
                <section className="mb-1">
                  <div className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-600">
                    Events
                  </div>
                  {results.events.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => navigate(`/trips/${event.tripId}/timeline`)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/50">
                        <CalendarDays className="h-3.5 w-3.5 text-amber-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                          {event.title}
                        </p>
                        <p className="text-xs text-zinc-400 capitalize truncate">{event.type.toLowerCase()}</p>
                      </div>
                    </button>
                  ))}
                </section>
              )}

              {/* Expenses */}
              {results.expenses.length > 0 && (
                <section className="mb-1">
                  <div className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-600">
                    Expenses
                  </div>
                  {results.expenses.map((expense) => (
                    <button
                      key={expense.id}
                      onClick={() => navigate(`/trips/${expense.tripId}/expenses`)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50">
                        <CreditCard className="h-3.5 w-3.5 text-emerald-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                          {expense.title}
                        </p>
                        <p className="text-xs text-zinc-400 truncate">
                          {expense.currency} {Number(expense.amount).toFixed(2)}
                        </p>
                      </div>
                    </button>
                  ))}
                </section>
              )}

              {/* Journal */}
              {results.journal.length > 0 && (
                <section className="mb-1">
                  <div className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-600">
                    Journal
                  </div>
                  {results.journal.map((entry) => (
                    <button
                      key={entry.id}
                      onClick={() => navigate(`/trips/${entry.tripId}/journal`)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950/50">
                        <BookOpen className="h-3.5 w-3.5 text-violet-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                          {entry.title ?? "Untitled entry"}
                        </p>
                        {entry.entryDate && (
                          <p className="text-xs text-zinc-400 truncate">
                            {new Date(entry.entryDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
