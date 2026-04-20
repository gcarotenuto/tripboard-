# User Journeys

## Overview

These four journeys cover the critical paths through TripBoard. They are written from the user's perspective, step by step, with notes on what the system does in the background. Edge cases and error states are noted where they matter for design decisions.

---

## Journey 1 — Onboarding and First Trip Creation

**User:** New user, arriving from the landing page after sign-up.

**Goal:** Get from zero to a trip with at least one event on the timeline.

**Steps:**

1. User completes sign-up (email + password, or Google/GitHub OAuth via NextAuth).
2. Email verification sent. User clicks link, account confirmed.
3. User lands on the Trip Hub dashboard. It is empty. A prominent CTA reads "Create your first trip."
4. User clicks CTA. A modal opens with fields:
   - Trip name (required)
   - Destination(s) (optional, freetext, one or multiple)
   - Start date / End date (optional at creation — some trips are loosely planned)
   - Cover image (optional)
5. User submits. Trip record created. User is redirected to the Trip Hub view for this trip.
6. The trip hub shows three tabs: Timeline, Vault, Daily Board. All are empty. A guided prompt appears: "Add your first booking — forward a confirmation email, upload a PDF, or enter manually."
7. User chooses "Enter manually." A form appears:
   - Event type (flight, hotel, train, car, activity, other)
   - Summary / title
   - Date and time
   - Location
   - Confirmation number (optional)
   - Notes (optional)
8. User fills in a hotel stay. Submits. Event appears on the Logistics timeline.
9. User sees the timeline populated. Onboarding is complete.

**System notes:**
- Trip creation fires a `trip.created` analytics event (no PII).
- Manual entry bypasses the ingestion pipeline entirely — straight to `timeline_events` insert.
- If user signs up but does not create a trip within 24 hours, a single reminder email is sent (can be disabled in settings).

**Edge cases:**
- If the user closes the modal mid-way, draft is discarded — no auto-save for trip creation.
- Date range is optional because some users create trip shells before they have confirmed dates.

---

## Journey 2 — Importing a Booking Confirmation

**Scenario A: Email Forward**

**User:** Marco, has a hotel confirmation in his work inbox. Wants it in TripBoard without granting inbox access.

1. User navigates to Settings → Import. Finds his personal TripBoard ingest address: `marco+tb-a3f9@in.tripboard.app`.
2. User opens the hotel confirmation email in his work inbox. Forwards it to his TripBoard ingest address.
3. TripBoard's inbound email handler receives the forwarded message (via webhook from the email provider).
4. A `parse_document` job is enqueued. UI shows a subtle "Processing import..." indicator on the Vault page (or via SSE notification if the user is on the app).
5. Job worker runs:
   - EmailAdapter extracts text body and PDF attachment (the hotel confirmation PDF).
   - Classifier identifies: type = `hotel`, sender domain matches known booking platforms, confidence = high.
   - Extractor (AI) pulls: hotel name, check-in date, check-out date, confirmation number, address, room type, rate.
   - Normalizer converts dates to UTC ISO 8601, strips whitespace from confirmation number.
   - Dedup check: no existing event with same confirmation number for this user → proceed.
   - `timeline_events` record created. `documents` record created. Raw PDF stored in object storage.
6. User (if on the app) sees a toast: "Hotel — Grand Hotel Roma added to your timeline." Timeline updates.
7. User clicks the event. Sees all extracted fields. A banner reads: "2 fields have low confidence — review recommended." The flagged fields are highlighted. User corrects the check-out date (AI read the wrong year).
8. User clicks through to the linked document. The original PDF is accessible via signed URL.

**Scenario B: PDF Upload**

1. User navigates to Vault → Upload.
2. Selects a PDF from their filesystem (or drags onto the upload zone).
3. Upload POSTs to `/api/v1/trips/:id/documents` (multipart). File stored in object storage. `parse_document` job enqueued.
4. Same pipeline as above from step 5 onward.
5. If no trip is associated at upload time, user is prompted to assign the document to a trip (or create a new one).

**Edge cases:**
- If classification confidence is below threshold (< 0.5), the document is placed in the Vault as "Unclassified" and the user is prompted to review. No event is created.
- If a duplicate is detected (same confirmation number, same user), the job completes but no new record is created. User sees: "This confirmation already exists in your trip."
- Unsupported file types (e.g., .docx, .xlsx) are rejected at upload with a clear error message.

---

## Journey 3 — Living the Trip (Daily Board During Travel)

**User:** Yuki, currently in Porto on day 3 of a 10-day trip. She has a walking tour booked at 10:00 and a dinner reservation at 20:00.

1. Yuki opens TripBoard on her phone (mobile browser). She is on slow 3G.
2. App loads the Daily Board for today. She sees:
   - 10:00 — Porto Historic District Walking Tour (logistics event, linked to confirmation)
   - 20:00 — Dinner, Tasca do Chico (logistics event, manual entry)
3. At 9:45, she taps the tour event. Sees the booking details and the guide's contact number she saved in the notes.
4. After the tour, she opens Journal Mode from the Daily Board quick-entry widget. Types a few sentences about the tour — the guide's story about the Carnation Revolution. Tags the location (Ribeira, Porto). Attaches two photos from her camera roll.
5. Entry saved. Appears immediately in the Moments tab of the timeline.
6. At lunch, she decides to skip the dinner reservation and go somewhere else instead. Opens the dinner event, marks it as "Skipped," adds a note: "Went to Taberna Dos Ferreiros instead — much better."
7. She creates a new manual Moments entry for the actual dinner: name, location, notes, rating.
8. End of day: she opens the Daily Board. Sees the full day: planned events (one attended, one skipped), two journal entries, three photos. She's satisfied — the day is captured.

**System notes:**
- Daily Board loads current day by default; user can swipe/navigate to other days.
- Journal entries are saved optimistically — written to local state immediately, synced to server in the background. If sync fails, a retry queue holds the entry.
- Photo uploads are queued if on slow connection and upload when connectivity improves (v0.5 offline feature — at MVP, uploads are attempted immediately and fail gracefully with a retry prompt).

**Edge cases:**
- If the user has no internet, the Daily Board shows cached data from last load. Journal entries can be written to local draft storage and synced when connectivity returns (full offline support is v0.5; at MVP, a "connection lost" banner appears).

---

## Journey 4 — Post-Trip: Archive and Memory Capsule

**User:** Marco, has just returned from a 4-day trip to Amsterdam. The trip has 8 logistics events, 5 journal entries, 12 expenses, and 7 documents in the vault.

1. Marco opens the trip in Trip Hub. A banner appears: "Your trip ended 2 days ago. Ready to archive?"
2. He clicks "Review before archiving." He scans the timeline — notices one expense he forgot to log (a museum entry fee). He adds it.
3. He reviews the Vault — all documents present.
4. He clicks "Archive Trip." A confirmation dialog explains: the trip will be read-only, and a Memory Capsule will be generated.
5. He confirms. The trip status changes to "Archived." A `generate_capsule` job is enqueued.
6. Within 30–60 seconds, a notification appears: "Your Memory Capsule is ready."
7. Marco opens the Memory Capsule. It contains:
   - A 3–4 paragraph narrative generated by AI, drawing on journal entries, places visited, and key logistics events. Tone is reflective, not listy.
   - A summary section: dates, destination, total duration, number of days.
   - Expense summary: total spend, breakdown by category.
   - Places visited (linked to journal entries).
   - Document count.
8. He reads the capsule. It captured the canal boat tour he wrote about, the work dinner that ran long, and the fact that he arrived late due to a delay (pulled from his journal note on the flight event).
9. He clicks "Export." A ZIP is generated containing: the capsule as PDF, all documents from the vault, a JSON export of all events and expenses.
10. He downloads it. Has a complete record of the trip, independent of TripBoard.

**System notes:**
- AI capsule generation uses the AI provider abstraction. The prompt includes: all journal entries, event names and dates, places visited, expense categories and totals. PII (confirmation numbers, exact addresses) is included because this is the user's own data sent to an AI API on their behalf.
- The capsule narrative is not editable. However, the user can add a personal note to the capsule (freetext, appended below the AI summary).
- Export ZIP is generated asynchronously and delivered via a signed download link valid for 24 hours.

**Edge cases:**
- If the trip has no journal entries, the capsule is generated from logistics events alone. The AI is instructed to produce a factual summary rather than a narrative.
- If AI generation fails, the capsule falls back to a structured (non-narrative) summary generated without AI. User is notified.
- Archive is reversible: an archived trip can be un-archived (moved back to active) if the user needs to make edits. The Memory Capsule is regenerated when re-archived.
