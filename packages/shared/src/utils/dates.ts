export type DateFormatPref = "MDY" | "DMY" | "YMD";

export function formatDate(date: string | Date, timezone?: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: timezone,
  });
}

/** Format a date according to the user's preferred format setting. */
export function formatDateByPref(date: string | Date, pref: DateFormatPref = "MDY", timezone?: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const opts: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric", timeZone: timezone };
  if (pref === "DMY") {
    return d.toLocaleDateString("en-GB", opts);
  }
  if (pref === "YMD") {
    // ISO-style: YYYY-MM-DD
    const tzDate = timezone
      ? new Date(d.toLocaleString("en-US", { timeZone: timezone }))
      : d;
    const y = tzDate.getFullYear();
    const mo = String(tzDate.getMonth() + 1).padStart(2, "0");
    const dy = String(tzDate.getDate()).padStart(2, "0");
    return `${y}-${mo}-${dy}`;
  }
  // MDY default
  return d.toLocaleDateString("en-US", opts);
}

export function formatDateTime(date: string | Date, timezone?: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  });
}

export function formatTime(date: string | Date, timezone?: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  });
}

export function getDurationText(startsAt: string | Date, endsAt: string | Date): string {
  const start = typeof startsAt === "string" ? new Date(startsAt) : startsAt;
  const end = typeof endsAt === "string" ? new Date(endsAt) : endsAt;
  const diffMs = end.getTime() - start.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function getTripDurationDays(startsAt: string | Date, endsAt: string | Date): number {
  const start = typeof startsAt === "string" ? new Date(startsAt) : startsAt;
  const end = typeof endsAt === "string" ? new Date(endsAt) : endsAt;
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export function isTripActive(startsAt?: string | null, endsAt?: string | null): boolean {
  if (!startsAt || !endsAt) return false;
  const now = new Date();
  return new Date(startsAt) <= now && now <= new Date(endsAt);
}

export function isTripUpcoming(startsAt?: string | null): boolean {
  if (!startsAt) return false;
  return new Date(startsAt) > new Date();
}

export function groupEventsByDay(events: Array<{ startsAt: string | null; [key: string]: unknown }>) {
  const groups: Record<string, typeof events> = {};
  for (const event of events) {
    if (!event.startsAt) {
      const key = "undated";
      groups[key] = groups[key] ?? [];
      groups[key].push(event);
      continue;
    }
    const key = new Date(event.startsAt).toISOString().split("T")[0];
    groups[key] = groups[key] ?? [];
    groups[key].push(event);
  }
  return groups;
}
