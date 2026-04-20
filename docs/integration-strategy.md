# Integration Strategy

## Why Universal Direct Integrations Are Not Feasible for MVP

The instinct to "integrate with everything" is common in travel apps and almost always leads to the same outcome: a maintenance nightmare of brittle API integrations that break whenever airlines, hotels, or booking platforms change their APIs or revoke developer access.

The specific problems:

**API availability is inconsistent.** Major airlines (United, Delta, Lufthansa) have booking APIs, but they are designed for OTA partners, not personal productivity apps. Getting production access requires commercial agreements. Many hotel chains have no public API at all.

**OAuth scope creep.** Connecting to a user's Gmail or Outlook to find booking confirmations requires broad inbox read permissions. Users grant this once and then forget they did. The attack surface is large: one compromised integration exposes every email the user has ever sent or received.

**Rate limits and ToS fragility.** Scraping booking confirmation pages (as some travel apps do) violates ToS and breaks with every UI change. API wrappers around scrapers are not stable infrastructure.

**Maintenance load.** Each direct integration requires dedicated maintenance. Booking platforms update their email formats, change their APIs, or add 2FA flows. A team of one or two cannot keep 10 integrations working.

The adapter-based approach is the honest alternative: TripBoard defines a clear contract for how documents enter the system, and the user controls what goes in. The result is fewer sources but reliable ones.

---

## Adapter-Based Ingestion Architecture

Every ingestion source is a named adapter implementing the `IngestionAdapter` interface:

```typescript
interface IngestionAdapter {
  name: string;
  accepts(input: RawInput): boolean;
  process(input: RawInput): Promise<RawDocument[]>;
}

interface RawDocument {
  sourceType: SourceType;       // 'email' | 'pdf' | 'image' | 'ics' | 'manual'
  rawText: string;              // extracted text content
  rawBytes?: Buffer;            // original file bytes (if applicable)
  mimeType?: string;
  metadata: Record<string, unknown>;  // source-specific metadata
}
```

The pipeline is source-agnostic from the `classify` step onward. All adapters produce `RawDocument[]`; downstream steps do not know or care which adapter produced the document.

Adding a new source requires:
1. Write a new adapter implementing `IngestionAdapter`.
2. Register it in the adapter registry.
3. Add any source-specific intake route (e.g., a new webhook endpoint).
4. No changes to classify, extract, normalize, or dedup.

---

## Supported Ingestion Sources (MVP)

### 1. Forwarded Email (Webhook)
**How it works:** User forwards any email to their personal TripBoard ingest address (e.g., `userid+token@in.tripboard.app`). An inbound email service (SendGrid Inbound Parse, Postmark Inbound, or Mailgun Routes) handles MX routing and fires a POST webhook to `/api/ingest/email`.

**Adapter behavior:**
- Parses raw MIME email.
- Extracts plain text and HTML body.
- Extracts PDF and image attachments.
- Produces one `RawDocument` per content unit (body text + one per attachment).
- Each attachment is processed independently through the pipeline.

**Authentication:** Webhook authenticated via HMAC signature from the email provider. Ingest address token validated against user record.

**Limitations:** HTML rendering artifacts can confuse extraction. The adapter strips HTML tags before passing to the classifier.

### 2. PDF Upload
**How it works:** User uploads a PDF via the Vault upload interface or the import button. Handled by a multipart POST to `/api/v1/trips/:id/documents`.

**Adapter behavior:**
- Validates file type and size (max 25MB at MVP).
- Extracts text using a PDF text extraction library (pdf-parse or pdfjs).
- If text extraction yields < 100 characters (scanned/image PDF), falls back to OCR path.
- Stores raw file in object storage.
- Produces `RawDocument` with extracted text.

### 3. Image Upload (with OCR)
**How it works:** User uploads a photo of a document (boarding pass, printed confirmation, etc.). Same upload endpoint as PDF; MIME type determines routing.

**Adapter behavior:**
- Validates image type (JPEG, PNG, HEIC) and size (max 10MB).
- Sends image to OCR service (Tesseract via a worker, or Google Vision API, or AWS Textract depending on quality requirements).
- OCR output is treated as raw text for the classify/extract pipeline.
- **Handwritten documents are not supported.** OCR is tuned for machine-printed text. Handwritten content will produce low-confidence or failed extractions, and the document is placed in the Vault as "Unclassified."

### 4. Manual Entry
**How it works:** User fills a structured form in the UI.

**Adapter behavior:**
- Form validation on the client.
- No parsing pipeline needed — data is already structured.
- Creates a `timeline_event` and optionally a `document` record directly.
- No AI involved.

**Note:** Manual entry always produces 100% confidence fields (user entered them). No review prompt.

### 5. .ics File Import
**How it works:** User uploads or pastes an iCalendar (.ics) file from any calendar app.

**Adapter behavior:**
- Parses iCal format using a library (node-ical or ical.js).
- Maps VEVENT records to `RawDocument` objects.
- Classify step recognizes iCal events and maps them to `activity` or `other` type.
- Extract step pulls DTSTART, DTEND, SUMMARY, LOCATION, DESCRIPTION, UID.
- Dedup uses UID to prevent re-importing the same calendar event.

**Use cases:** Importing a tour booking from a calendar invite, syncing a conference schedule, importing a hotel checkout reminder from Apple Calendar.

### 6. Mailbox Connector Abstraction (Architecture Only — Future)
**What exists at MVP:** A `MailboxConnector` interface stub in `packages/ingestion/adapters/mailbox.ts`. No live implementations.

**What it defines:**
```typescript
interface MailboxConnector {
  name: string;
  authType: 'oauth2';
  fetchConfirmations(userId: string, since: Date): Promise<RawInput[]>;
  revokeAccess(userId: string): Promise<void>;
}
```

**Why it exists now:** Designing the interface now means that when a Gmail or Outlook connector is built, it plugs into the same pipeline without architectural changes. The connector produces the same `RawInput` that the email webhook adapter already handles.

**What it does NOT do at MVP:** There is no UI for connecting a mailbox, no OAuth flows, no background polling. The interface is dormant code.

---

## Parsing Pipeline

```
Input (raw email / PDF bytes / image / ics / form data)
    │
    ▼
[Adapter]
    Extracts raw text and/or bytes.
    Produces: RawDocument[]
    │
    ▼
[Classify]
    Input:  RawDocument (text content)
    Output: { type: DocumentType, confidence: number, method: 'rule' | 'ai' }

    Rule-based fast path (no AI cost):
    - Known sender domains → flight, hotel, car
    - .ics MIME type → calendar
    - Subject line patterns → receipt, visa

    AI fallback (when confidence < 0.75 from rules):
    - Send text to AI provider with classification prompt
    - Returns: type + confidence score

    If confidence < 0.4 after both → type = 'unclassified', proceed to vault without event creation
    │
    ▼
[Extract]
    Input:  RawDocument + DocumentType
    Output: ExtractedFields (typed per document type)

    AI call with structured output schema.
    Each field in schema has an associated confidence score.
    Fields with confidence < 0.6 are flagged for user review.

    Example schema for 'flight':
    {
      airline: string,
      flightNumber: string,
      origin: { code: string, name: string },
      destination: { code: string, name: string },
      departureAt: string (ISO 8601),
      arrivalAt: string (ISO 8601),
      confirmationNumber: string,
      passengerName: string,
      class: string
    }
    │
    ▼
[Normalize]
    Input:  ExtractedFields
    Output: CanonicalEvent | CanonicalDocument

    - All dates → UTC ISO 8601
    - Currency codes → ISO 4217 uppercase
    - Confirmation numbers → trimmed, uppercase
    - Airline codes → IATA format where possible
    - Airport codes → IATA 3-letter where possible
    │
    ▼
[Dedup]
    Input:  CanonicalEvent, userId, tripId (if known)
    Output: { isDuplicate: boolean, existingId?: string }

    Match criteria (any one sufficient):
    - Same confirmation number + same user
    - Same flight number + same departure date + same user
    - Same hotel name + same check-in date + same confirmation number

    If duplicate: job completes, no new record, user notified.
    │
    ▼
[Persist]
    - db.timelineEvent.create() or db.document.create()
    - storage.put(rawFile, key) for original file
    - Notify user via SSE/WebSocket (v0.2+)
```

---

## AI Extraction Role

The AI layer is responsible for understanding unstructured text and returning structured data. It is not responsible for routing, storage, or business logic. Specific responsibilities:

**Classification (when rules fail):** Given the raw text of a document, determine what type it is from a fixed enum. Return a confidence score. The prompt is explicit about the enum values; the AI is not asked to invent types.

**Field extraction:** Given raw text and a known document type, extract specific fields into a typed schema. Structured output (JSON mode / tool use) is used to ensure parseable results. The AI is instructed to return null for fields it cannot find, not to hallucinate values.

**Confidence scoring:** Each extracted field includes a confidence score (0.0–1.0). This is generated by the AI as part of the structured output. Fields with confidence below the review threshold are flagged in the UI. The user always has the ability to correct extracted fields.

**Post-trip summarization:** For Memory Capsule generation, the AI receives a compiled prompt of all journal entries, event names, and places, and is asked to write a reflective narrative. This is a generative task, not an extraction task, so structured output is not used.

---

## Future Integration Roadmap

**v0.3–v0.4:** Google Calendar OAuth connector. Users can grant read access to a specific calendar (not full inbox). Flight and hotel events from calendar imports are processed through the pipeline.

**v0.5:** Gmail OAuth connector with narrow scope. Reads only emails from known travel sender domains (filtered at query time). User must explicitly approve the domain list. Access can be revoked at any time.

**v1.0:** Outlook / Exchange connector. Same model as Gmail.

**Post-v1.0:**
- Apple Wallet pass import (boarding passes).
- WhatsApp/Telegram message forward (travel itinerary shared in chat).
- Direct GDS API integration for corporate travel booked through managed travel platforms (Concur, TravelPerk).

The adapter architecture means none of these require changes to the pipeline — only new adapter implementations.
