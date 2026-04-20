import type { ParsedICSEvent } from "@tripboard/shared";

/**
 * ICSAdapter parses iCalendar (.ics) files into structured events.
 * Used for importing bookings from services that support calendar export.
 */
export class ICSAdapter {
  async parse(icsContent: string): Promise<ParsedICSEvent[]> {
    try {
      const ical = await import("node-ical");
      const parsed = ical.sync.parseICS(icsContent);
      const events: ParsedICSEvent[] = [];

      for (const [, component] of Object.entries(parsed)) {
        if (component.type !== "VEVENT") continue;

        const event = component as {
          uid?: string;
          summary?: string;
          description?: string;
          location?: string;
          start?: Date;
          end?: Date;
          organizer?: { val?: string };
          url?: string;
        };

        events.push({
          uid: event.uid ?? crypto.randomUUID(),
          summary: event.summary ?? "Untitled Event",
          description: event.description,
          location: event.location,
          dtstart: event.start ?? new Date(),
          dtend: event.end,
          organizer: event.organizer?.val,
          url: event.url,
        });
      }

      return events;
    } catch (err) {
      console.error("[ICSAdapter] Failed to parse ICS:", err);
      return this.parseBasicICS(icsContent);
    }
  }

  private parseBasicICS(icsContent: string): ParsedICSEvent[] {
    // Minimal fallback parser for VEVENT blocks
    const events: ParsedICSEvent[] = [];
    const eventBlocks = icsContent.split("BEGIN:VEVENT").slice(1);

    for (const block of eventBlocks) {
      const getField = (name: string): string => {
        const match = block.match(new RegExp(`${name}[^:]*:(.+)`));
        return match ? match[1].trim() : "";
      };

      const dtstart = getField("DTSTART");
      events.push({
        uid: getField("UID") || crypto.randomUUID(),
        summary: getField("SUMMARY") || "Imported Event",
        description: getField("DESCRIPTION") || undefined,
        location: getField("LOCATION") || undefined,
        dtstart: dtstart ? new Date(dtstart) : new Date(),
        dtend: getField("DTEND") ? new Date(getField("DTEND")) : undefined,
      });
    }

    return events;
  }
}
