# MVP Scope

## Definition and Principles

The MVP is a working, deployable web application that covers the full trip lifecycle for a solo traveler: plan a trip, import documents, track logistics, journal experiences, log expenses, and archive the trip when done. It does not need to be feature-complete. It needs to be coherent — every module should work end to end, even if some edges are rough.

**Principles:**

- **Depth over breadth.** It is better to have a document vault that works well than five half-built integrations that don't.
- **Explicit over automatic.** The user always initiates ingestion. No background polling, no inbox crawlers.
- **Offline-tolerant UI.** The interface should degrade gracefully on slow or missing connections, even if full offline mode is a v0.5 concern.
- **Boring infrastructure.** Use well-understood tools. Delay novel architectural choices until there is a real reason for them.
- **No fake integrations.** If a connector is not fully implemented, it is not advertised. The adapter architecture makes this honest: a source is either supported or it is not.

---

## In-Scope Modules

### Trip Hub
Central dashboard listing all trips. Each trip has a name, destination(s), date range, cover image (optional), and status (planning / active / archived). Entry point to all other modules.

### Unified Timeline
The core view. Two switchable perspectives on the same underlying data:

- **Logistics view** — ordered list of bookings, reservations, and transport events. Each event shows confirmation number, timing, location, document links, and notes.
- **Moments view** — chronological journal entries, photos, and tagged locations. Shows what actually happened, not what was booked.

Both views share the same date axis, so users can cross-reference planned vs. actual.

### Document Vault
Structured storage for all travel documents. Each document has: type (flight, hotel, visa, insurance, rail, car, receipt, other), source (upload, email, manual), upload date, associated trip, tags, and raw file. Documents are linked to timeline events where applicable. Vault is browsable and searchable independently of the timeline.

### Multi-Source Import
The ingestion layer supports the following sources at MVP:

- **Email forward** — user forwards a confirmation email to a TripBoard address. Processed via inbound email webhook (e.g., SendGrid Inbound Parse or Postmark). Email body and attachments are parsed.
- **PDF upload** — user uploads a PDF directly. Sent through the parsing pipeline.
- **Image upload** — user uploads a photo of a document (e.g., printed boarding pass). OCR extracts text, which is then sent through the parsing pipeline. Handwritten documents are out of scope.
- **Manual entry** — user fills a structured form to create a logistics event directly. No parsing required.
- **.ics import** — user uploads or pastes an iCalendar file. Events are mapped to the timeline.
- **Mailbox connector abstraction** — the architecture includes a connector interface for future OAuth-based mailbox access, but no live connectors are built for MVP. The abstraction exists so adding one does not require rewiring the pipeline.

### Places and Events
A place entity represents a real-world location (city, venue, restaurant, attraction). Events reference places. Users can add notes, ratings, and photos to places. This is not a full recommendation engine — it is structured context attached to where things happened.

### Daily Board
A day-view that aggregates all logistics events and journal entries for a given day. Designed for use during active travel: shows what's coming next, what needs to be checked in, and has a quick-entry widget for logging a moment.

### Journal Mode
Rich text entry for Moments. Supports text, embedded images, location tagging, mood tagging, and links to logistics events (e.g., "we missed this flight" linked to the flight event). Entries appear in the Moments timeline.

### Expense Tracking
Per-trip expense log. Each expense has: amount, currency, category, date, payer, notes, and optional receipt link (to a document in the vault). Summary view shows spend by category and by day. No automatic currency conversion at MVP — user enters the amount in local currency and optionally records the home-currency equivalent.

### Archive / Memory Capsule
When a trip is marked complete, it is moved to Archive. An AI-generated Memory Capsule is created: a short narrative summary of the trip drawn from journal entries, places visited, and expenses. The capsule is read-only and stored permanently. Users can also generate a shareable (but non-public by default) export of the capsule.

---

## Out of Scope for MVP

- **Native mobile apps** (iOS / Android). The web app should be mobile-responsive, but no native builds.
- **Real-time collaboration.** Trips are single-user at MVP. A sharing/invite model is a future concern.
- **Direct booking integrations.** No live connections to airline, hotel, or rail APIs. Booking data enters only through the ingestion pipeline (forward, upload, manual).
- **OCR on handwritten documents.** Machine-printed text is supported; cursive and handwriting are not.
- **Automatic currency conversion.** Exchange rates are not fetched; user handles conversion manually.
- **Push notifications.** No email or SMS reminders at MVP.
- **Offline-first sync.** The app should be usable on slow connections but does not implement a local-first data model or service worker cache at MVP.

---

## Success Criteria

The MVP is considered complete when:

1. A user can create a trip, forward a booking confirmation email, and see a parsed event appear on the Logistics timeline without manual data entry.
2. A user can upload a PDF (hotel confirmation, insurance policy, visa) and have it appear in the Document Vault with correct metadata.
3. A user can write a journal entry for a day, attach a photo, and see it in the Moments timeline.
4. A user can log expenses across a trip and see a category breakdown.
5. A user can mark a trip complete and have a Memory Capsule generated.
6. All user data can be exported in full (JSON + files) on request.
7. The application passes basic security review: no unprotected API endpoints, signed URLs for file access, no PII in logs.
