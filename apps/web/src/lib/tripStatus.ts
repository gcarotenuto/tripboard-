/**
 * Computes the correct trip status from dates.
 * Rules:
 *   - endsAt in the past            → COMPLETED
 *   - startsAt <= now <= endsAt     → ACTIVE
 *   - startsAt within 30 days       → UPCOMING
 *   - otherwise                     → PLANNING
 *
 * Never downgrades a trip that was manually set to COMPLETED or ARCHIVED.
 */
export function computeTripStatus(
  current: string,
  startsAt: Date | null,
  endsAt: Date | null,
): string {
  // Never auto-change manually completed or archived trips
  if (current === "COMPLETED" || current === "ARCHIVED") return current;

  const now = new Date();

  if (endsAt && endsAt < now) return "COMPLETED";
  if (startsAt && startsAt <= now && (!endsAt || endsAt >= now)) return "ACTIVE";
  if (startsAt) {
    const daysUntil = (startsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (daysUntil <= 30) return "UPCOMING";
  }
  return "PLANNING";
}
