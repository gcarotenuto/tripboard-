"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((r) => r.data);

interface WeatherDay {
  date: string;
  maxTemp: number;
  minTemp: number;
  precipitation: number;
  code: number;
  description: string;
  emoji: string;
}

interface WeatherData {
  city: string;
  days: WeatherDay[];
}

function getDayLabel(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = date.getTime() - today.getTime();
  if (diff === 0) return "Today";
  if (diff === 86400000) return "Tomorrow";
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

function isToday(dateStr: string): boolean {
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date.getTime() === today.getTime();
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 animate-pulse">
      <div className="h-8 w-8 rounded-lg bg-zinc-200 dark:bg-zinc-700 shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-2.5 w-24 rounded bg-zinc-100 dark:bg-zinc-800" />
      </div>
      <div className="h-4 w-14 rounded bg-zinc-200 dark:bg-zinc-700" />
    </div>
  );
}

export function WeatherWidget({ tripId }: { tripId: string }) {
  const { data, error, isLoading } = useSWR<WeatherData | null>(
    `/api/trips/${tripId}/weather`,
    fetcher
  );

  return (
    <div className="rounded-xl border border-zinc-200/60 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
        <span className="text-base">🌤️</span>
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
          Weather forecast
        </p>
      </div>

      <div className="p-4">
        {/* Loading */}
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <p className="text-sm text-zinc-400 dark:text-zinc-600 text-center py-2">
            Could not load forecast right now.
          </p>
        )}

        {/* No destination */}
        {!isLoading && !error && data === null && (
          <div className="text-center py-5 space-y-2">
            <p className="text-3xl">🌍</p>
            <div>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                No destination set
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 leading-relaxed">
                Add a primary destination to your trip — the 7-day forecast will appear here automatically.
              </p>
            </div>
          </div>
        )}

        {/* Weather data */}
        {!isLoading && !error && data && (
          <div>
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
              {data.city}
            </p>
            <div className="space-y-1">
              {data.days.map((day) => {
                const today = isToday(day.date);
                return (
                  <div
                    key={day.date}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                      today
                        ? "bg-indigo-50 dark:bg-indigo-950/40 ring-1 ring-indigo-100 dark:ring-indigo-900"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    }`}
                  >
                    {/* Emoji */}
                    <span className="text-xl w-8 text-center shrink-0" title={day.description}>
                      {day.emoji}
                    </span>

                    {/* Day label */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium leading-none ${
                          today
                            ? "text-indigo-700 dark:text-indigo-300"
                            : "text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        {getDayLabel(day.date)}
                      </p>
                      <p className="text-[11px] text-zinc-400 dark:text-zinc-600 mt-0.5 truncate">
                        {day.description}
                        {day.precipitation > 0 && ` · 💧 ${day.precipitation} mm`}
                      </p>
                    </div>

                    {/* Temps */}
                    <div className="flex items-center gap-1.5 shrink-0 text-sm font-medium">
                      <span className="text-zinc-800 dark:text-zinc-200">{day.maxTemp}°</span>
                      <span className="text-zinc-300 dark:text-zinc-600">/</span>
                      <span className="text-zinc-400 dark:text-zinc-500">{day.minTemp}°</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
