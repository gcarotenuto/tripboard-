import type { CreateEventInput, EventType, EventView } from "@tripboard/shared";
import type { ExtractionEvent } from "@tripboard/shared";

const LOGISTICS_TYPES = new Set<string>([
  "FLIGHT", "TRAIN", "BUS", "CAR_RENTAL", "FERRY",
  "HOTEL", "ACCOMMODATION", "TRANSFER", "VISA", "INSURANCE", "HEALTH",
]);

/**
 * Normalizes AI extraction output into CreateEventInput ready for DB insertion.
 */
export function normalizeExtractionEvent(
  event: ExtractionEvent,
  documentId: string,
  sourceType: string
): CreateEventInput & { sourceDocumentId: string; sourceType: string; confidence: number } {
  const type = normalizeEventType(event.type);
  const view = determineView(type);

  return {
    title: event.title,
    type,
    view,
    startsAt: event.startsAt ?? undefined,
    endsAt: event.endsAt ?? undefined,
    locationName: event.locationName ?? undefined,
    details: event.details,
    sourceDocumentId: documentId,
    sourceType,
    confidence: event.confidence,
  };
}

function normalizeEventType(raw: string): EventType {
  const upper = raw.toUpperCase().replace(/[\s-_]/g, "_") as EventType;
  const valid: EventType[] = [
    "FLIGHT", "TRAIN", "BUS", "CAR_RENTAL", "FERRY", "HOTEL",
    "ACCOMMODATION", "RESTAURANT", "ACTIVITY", "TOUR", "TRANSFER",
    "MOMENT", "PHOTO", "NOTE", "VISA", "INSURANCE", "HEALTH", "OTHER",
  ];
  return valid.includes(upper) ? upper : "OTHER";
}

function determineView(type: EventType): EventView {
  if (LOGISTICS_TYPES.has(type)) return "LOGISTICS";
  if (type === "RESTAURANT" || type === "ACTIVITY" || type === "TOUR") return "BOTH";
  return "MOMENTS";
}
