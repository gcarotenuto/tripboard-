# TripBoard — Product Strategy & Competitive Differentiation

**Version:** 0.2 (Phase: MVP differentiation)
**Date:** April 2026

---

## 1. The Problem We Solve

Travel planning tools fall into two broken buckets:

**Aggregation tools (TripIt, TripCase)** are clever at harvesting your inbox. They parse booking emails automatically, which feels like magic until you realize you've handed a third-party OAuth token to your entire inbox, your confirmation data lives in their cloud under their terms, and the moment you stop paying they stop caring. The moment a confirmation arrives as a PDF, or as a WhatsApp screenshot, or as a printed voucher, they fail silently. When the trip is over, everything goes stale. There is no memory layer.

**Planning tools (Wanderlog, Sygic, TripAdvisor trips)** are strong at maps, collaborative lists, and wishlists. They're designed for the planning phase — "what should we do in Lisbon?" — but they deteriorate once you're actually there. They don't know you're at the airport. They don't have your boarding pass. They don't help you capture the moment. They have no archive.

**Generic travel journals** capture what happened, but only if you remember to open them. They have no connection to your logistics. They don't know you missed a connection. They have no structure — they're glorified note apps with a travel theme.

---

## 2. What TripBoard Is

**TripBoard is a privacy-first, document-first travel operating system.**

The organizing principle is the full trip lifecycle:

```
COLLECT DOCUMENTS → NORMALIZE TRIP DATA → POWER DAILY OPERATIONS → CAPTURE MOMENTS → ARCHIVE AND RECAP
```

At every stage, the user is in control. Nothing happens in the background without their knowledge. Every extracted field is auditable. Every document is stored permanently and associated with its source. Every moment captured returns value in the archive.

---

## 3. Competitor Positioning Map

| Dimension | TripBoard | TripIt | Wanderlog | Travel journals |
|---|---|---|---|---|
| **Core model** | Document-first travel OS | Inbox aggregation | Collaborative planning | Post-trip journaling |
| **During the trip** | ★★★★★ Command center | ★★★ Itinerary reference | ★★ Checklist | ★ Write after |
| **Privacy** | ★★★★★ No inbox scanning | ★ Full inbox access | ★★★ No scanning | ★★★★ Local only |
| **Document intelligence** | ★★★★★ First-class vault | ★★ Extracted, discarded | ★ None | ★ None |
| **After the trip** | ★★★★★ Memory capsule | ★ Stale itinerary | ★★ Basic archive | ★★★★ Story |
| **Offline** | ★★★★ Progressive | ★★★ Cached | ★★★★ Good offline | ★★★★★ |
| **Group trips** | ★★ Single user | ★★★ Shared itinerary | ★★★★★ Core feature | ★ None |
| **Booking search** | ★ None by design | ★ None | ★★ Limited | ★ None |

**We win on:** privacy, document intelligence, during-trip operations, post-trip memory.
**We concede:** group collaboration, booking discovery, live flight tracking.

---

## 4. Who We're Building For

**Primary persona: The Intentional Traveler**

- Takes 2–6 significant trips per year
- Values the travel experience as much as the destination
- Slightly paranoid about data privacy — would not give an app access to their entire inbox
- Has already been burned by booking confirmations that "didn't sync" in TripIt
- Keeps a travel journal but loses it — or never starts
- Gets frustrated when they can't find a confirmation PDF at the check-in counter
- Wants to remember their trips long after they happen
- Does not need AI to suggest restaurants

**Secondary persona: The Organized Professional Traveler**

- Travels frequently for work and leisure
- Has multiple open trips at once
- Needs to track expenses per-trip for reimbursement
- Prioritizes reliable, structured access to documents during travel
- Already has a system but it's fragile (Gmail search + Notes app + WhatsApp screenshots)

---

## 5. The Five Killer Features

These are the features that create defensible differentiation. They are not incremental improvements — they are structural advantages that come from the document-first architecture.

### 5.1 Document Intelligence Vault

Every document uploaded goes through a classification → extraction → confidence scoring pipeline. The vault shows:

- **What was extracted** (fields, values, confidence)
- **What still needs review** (low-confidence extractions, ambiguous dates)
- **What's relevant today** ("Ready Today" bundle — boarding passes, hotel vouchers, car rental docs scoped to today's events)
- **Where it came from** (source provenance: email forward, PDF upload, manual entry)

This is not a file cabinet. It's the operational intelligence layer of the trip.

### 5.2 Dual Timeline DNA

Two views. Same date axis. Completely different purpose and visual language.

**Logistics View** — execution checklist:
- Am I confirmed? Do I need to check in? Do I have the document?
- Flight numbers, confirmation refs, hotel vouchers — front and center
- Status indicators: ✅ Confirmed · ⏰ Check-in opens soon · ⚠️ Needs attention
- Linked documents visible inline
- Source confidence shown for extracted data

**Moments View** — living story:
- What actually happened?
- Journal card layout — quote-pull text, mood, location
- Rich, visual, story-first
- Linked to logistics events but not dominated by them

No other travel tool has this split. TripIt has only logistics. Travel journals have only moments. TripBoard has both, deliberately separated.

### 5.3 Daily Board as Operational Command Center

When you're traveling, you don't need a map or a suggestion engine. You need:
- What happens today (events from Logistics view, scoped to today)
- What documents to have ready (boarding passes, voucher QR codes)
- What you need to do before noon (check-in deadline, car pickup, reminder from yesterday)
- A quick way to capture a moment so you don't lose it

The Daily Board is designed for this. It is the screen you open at breakfast. It is not a calendar. It is not a map. It is not a chatbot. It is an operational briefing for an active traveler.

### 5.4 Privacy-First Trust Layer

Every piece of data extracted from a document carries:
- **Source attribution** — where did this come from (email/PDF/manual)?
- **Extraction confidence** — how sure is the parser that this is correct?
- **Edit path** — every extracted field can be corrected
- **Human review queue** — low-confidence extractions are flagged, not silently wrong

Users can see exactly what the system believes and why. Nothing is hidden behind a "smart" abstraction. This is in direct contrast to TripIt, which hides its parsing and gives users no visibility into confidence or errors.

### 5.5 Memory Capsule as Retention Engine

When a trip ends, TripBoard creates a Memory Capsule:
- AI-drafted narrative from journal entries and trip metadata
- Visual stats: days traveled, cities visited, documents archived, expenses logged
- Journal highlights (best entries, automatically surfaced)
- Permanent document retention — your boarding pass from 5 years ago is still here
- Shareable card (opt-in, no tracking)

This is a product feature that creates emotional return. Users come back to Archive. They share capsules. They feel the trip has been properly honored. No other travel tool has this with document permanence.

---

## 6. Five Features We Explicitly De-Prioritize

### 6.1 Background Inbox Scanning
**Why not:** Privacy liability, OAuth trust problem, maintenance burden, and TripIt already owns it.
**What we do instead:** Email-forward ingestion. Explicit, transparent, and zero inbox access.

### 6.2 Collaborative Group Trip Planning
**Why not:** Wanderlog owns this, and real-time collaboration infrastructure is expensive.
**What we do instead:** Build a shareable export for the archive. Solo-first, share-later.

### 6.3 Live Flight Tracking / Status Updates
**Why not:** Airline API costs, data freshness requirements, and push notification infrastructure.
**What we do instead:** The user can manually flag "flight delayed" — it becomes a journal entry.

### 6.4 Booking / Hotel Search
**Why not:** OTA territory (Booking.com, Hotels.com), affiliate model required.
**What we do instead:** Import the confirmation you already have. We normalize, we don't originate.

### 6.5 Chat / Conversational AI Interface
**Why not:** Chat is a generic interface that dilutes the product identity. It makes TripBoard look like every other AI wrapper.
**What we do instead:** AI is embedded into specific, purposeful tasks: classification, extraction, confidence scoring, Memory Capsule drafting. It is invisible until it surfaces useful information.

---

## 7. The MVP Main Loop

```
1. COLLECT → Forward a confirmation email / upload a PDF / type an entry
2. NORMALIZE → Pipeline classifies doc, extracts fields, scores confidence
3. REVIEW → User reviews extraction, corrects if needed, document becomes "trusted"
4. OPERATE → Logistics View + Daily Board consume the structured data
5. CAPTURE → Moments View + Journal capture what actually happened
6. PRESERVE → Archive + Memory Capsule permanently stores the trip
```

Every product decision should be evaluated against this loop. If a feature doesn't fit the loop, it's either a later phase or a competitor's problem.

---

## 8. What "Premium" Means for TripBoard

Premium is not about price point. It's about:

- **Confidence** — the user trusts the data because they can see its provenance
- **Speed during travel** — fast, offline-capable, no loading spinners when you're at security
- **Elegance under stress** — clean information hierarchy when you're lost in a foreign city
- **Permanence** — your travel archive is still beautiful and accessible in 10 years
- **Respect** — we don't scan your inbox, sell your data, or break your workflow with notifications

---

## 9. What We Will Not Build (Ever)

- Social feed / trip discovery
- Influencer trip planning tools
- AI "trip ideas" generator
- Hotel or flight booking
- Live maps during travel
- Public trip profiles
- Ads

---

## 10. Roadmap Priorities (Next 3 Phases)

### Phase 1: MVP Core Loop (current)
- Trip CRUD + status lifecycle
- Document Vault with upload, classification, confidence display
- Dual Timeline (Logistics + Moments)
- Daily Board (today's events + docs + checklist)
- Journal (quick capture + full entries)
- Expenses (per-trip ledger)
- Archive + Memory Capsule (static generation)

### Phase 2: Extraction Intelligence
- Full AI pipeline with real classification and field extraction
- Human review queue UI for low-confidence docs
- Conflict detection (duplicate events, date overlaps)
- "Ready Today" doc bundle with document preview
- Editable extracted field UI
- Reminder suggestions from document content

### Phase 3: Retention and Sharing
- Memory Capsule AI narrative generation
- Shareable Memory Capsule card (opt-in)
- Data export (JSON + files, full trip archive)
- Progressive Web App for offline-first mobile
- Push notifications for check-in reminders (opt-in only)
- Multi-trip search across all archived trips
