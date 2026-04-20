import type { TripEvent, CreateEventInput } from "@tripboard/shared";

interface DeduplicationResult {
  isDuplicate: boolean;
  duplicateOfId?: string;
  similarity: number;
}

/**
 * Checks if a candidate event is a duplicate of any existing event.
 * Uses a heuristic combining event type, title similarity, and datetime overlap.
 */
export function checkDuplicate(
  candidate: CreateEventInput,
  existingEvents: TripEvent[]
): DeduplicationResult {
  let highestSimilarity = 0;
  let duplicateOfId: string | undefined;

  for (const existing of existingEvents) {
    const similarity = computeSimilarity(candidate, existing);
    if (similarity > highestSimilarity) {
      highestSimilarity = similarity;
      duplicateOfId = existing.id;
    }
  }

  const isDuplicate = highestSimilarity >= 0.85;

  return {
    isDuplicate,
    duplicateOfId: isDuplicate ? duplicateOfId : undefined,
    similarity: highestSimilarity,
  };
}

function computeSimilarity(candidate: CreateEventInput, existing: TripEvent): number {
  let score = 0;
  let factors = 0;

  // Type match (hard requirement — different types are never duplicates)
  if (candidate.type !== existing.type) return 0;

  // Title similarity
  const titleSim = jaccardSimilarity(
    tokenize(candidate.title),
    tokenize(existing.title)
  );
  score += titleSim * 0.4;
  factors += 0.4;

  // Datetime overlap
  if (candidate.startsAt && existing.startsAt) {
    const timeDiff = Math.abs(
      new Date(candidate.startsAt).getTime() - new Date(existing.startsAt).getTime()
    );
    // Within 2 hours = high match
    const timeScore = timeDiff < 2 * 60 * 60 * 1000 ? 1 : timeDiff < 24 * 60 * 60 * 1000 ? 0.5 : 0;
    score += timeScore * 0.4;
    factors += 0.4;
  }

  // Location match
  if (candidate.locationName && existing.locationName) {
    const locSim = jaccardSimilarity(
      tokenize(candidate.locationName),
      tokenize(existing.locationName)
    );
    score += locSim * 0.2;
    factors += 0.2;
  }

  return factors > 0 ? score / factors : 0;
}

function tokenize(str: string): Set<string> {
  return new Set(str.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean));
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  const intersection = new Set([...a].filter((x) => b.has(x)));
  const union = new Set([...a, ...b]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}
