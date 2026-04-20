# Roadmap

## Overview

The roadmap is organized around capability milestones, not calendar dates. Each version has a clear definition of done and a rationale for the sequencing. The guiding principle is that each release should be usable end-to-end — no version should ship a half-built feature.

Versions are additive. Nothing in an earlier version is removed or broken by a later one.

---

## v0.1 — Core Scaffold

**Theme:** Get to a working application that can hold a trip.

**Goal:** A user can create an account, create a trip, add logistics events manually, upload documents to the vault, and see them on a timeline. No AI, no email ingestion.

**Scope:**

- Authentication (email/password, Google OAuth via NextAuth.js)
- Trip Hub: create, view, edit, delete trips
- Unified Timeline (Logistics view only): manual event creation (flight, hotel, car, activity, other)
- Document Vault: PDF and image upload, basic metadata (type, date, notes), view/download via signed URL
- Document linking: attach a vault document to a timeline event
- Basic UI shell: navigation, responsive layout, dark/light mode
- Database schema (Prisma): users, trips, timeline_events, documents
- Object storage integration (S3 / R2)
- Environment configuration, deployment pipeline (Vercel or equivalent)

**Definition of done:**
- User can complete a full manual trip from creation to a populated timeline.
- Document vault is functional: upload, list, view, delete.
- Application is deployed and accessible at a production URL.
- No known security vulnerabilities (basic audit: auth checks, signed URLs, input validation).

**What is explicitly not in v0.1:** Email ingestion, AI, journal, expenses, Daily Board, Moments timeline, Archive.

---

## v0.2 — Email Ingestion and AI Extraction

**Theme:** Let documents flow in without manual typing.

**Goal:** A user can forward a booking confirmation email and have it parsed into a structured timeline event automatically. PDF upload also enters the parsing pipeline.

**Scope:**

- Inbound email webhook (SendGrid or Postmark Inbound Parse)
- Per-user ingest email address generation and routing
- Ingestion pipeline: EmailAdapter, PdfAdapter
- Document classifier (rule-based fast path + AI fallback)
- AI field extractor (Anthropic Claude, structured output)
- AI provider abstraction (allows future swap to OpenAI or others)
- Normalize and dedup steps
- Low-confidence field flagging and user review UI
- Job queue setup (pg-boss on existing Postgres)
- Ingestion status indicators in the UI (polling or SSE)
- Confidence review UI: flagged fields highlighted, user can correct and confirm

**Definition of done:**
- Forward a flight confirmation from a major airline → event appears on timeline with correct fields.
- Forward a hotel confirmation from Booking.com or Expedia → hotel event appears.
- Upload a PDF → same pipeline, same result.
- Duplicate confirmations do not create duplicate events.
- Low-confidence fields are visible and editable before confirming.

**Rationale for sequencing:** Manual entry (v0.1) proves the data model and UI. Email ingestion (v0.2) proves the pipeline. AI is introduced only after the plumbing works.

---

## v0.3 — Journal, Expenses, and Daily Board

**Theme:** Make TripBoard useful during the trip, not just before it.

**Goal:** A user actively traveling can open TripBoard on their phone, see what's happening today, log a journal entry with a photo, and record an expense.

**Scope:**

- **Moments timeline:** second view on the Unified Timeline, showing journal entries and photos
- **Journal Mode:** rich text entry, photo attach, location tag, mood tag, link to logistics event
- **Daily Board:** day-view aggregating logistics events and journal entries, quick-entry widget
- **Expense Tracking:** per-trip expense log, categories, currency field, receipt link to vault document, category summary view
- Image upload adapter (OCR path for typed documents)
- .ics file import adapter
- Mobile-responsive layout improvements (Daily Board optimized for phone)
- Photo storage and display (images stored in object storage, displayed via signed URL)

**Definition of done:**
- User on mobile can see today's logistics and log a journal entry in under 60 seconds.
- Expense log shows accurate category totals.
- Moments and Logistics views are clearly distinct and both functional.
- .ics import maps calendar events to the timeline.

**Rationale for sequencing:** Ingestion (v0.2) fills the logistics side. v0.3 fills the human side — what actually happened. These are the two halves of the product.

---

## v0.4 — Archive and Memory Capsule

**Theme:** Close the trip lifecycle.

**Goal:** A user can mark a trip as complete, have an AI-generated Memory Capsule created, and export the full trip archive.

**Scope:**

- Trip archiving (status change, read-only mode)
- Memory Capsule generation (AI narrative from journal entries, events, places, expenses)
- Capsule display page
- User note appended to capsule (freetext, editable)
- Full data export (ZIP: JSON + original files)
- Export job queue and signed download link delivery
- Archive view in Trip Hub (separate from active trips)
- Post-trip expense summary in capsule

**Definition of done:**
- Archive a trip with at least 3 journal entries → capsule generated with a readable narrative.
- Export ZIP downloads correctly and contains all expected files.
- Archived trips are read-only but accessible.
- Capsule falls back to structured summary if AI generation fails.

**Rationale for sequencing:** The capsule is only meaningful after the journal and timeline are populated. v0.3 builds the content; v0.4 closes the loop.

---

## v0.5 — Offline Support and PWA

**Theme:** Make TripBoard reliable in the field.

**Goal:** Users can view their itinerary and log entries without an internet connection. Data syncs when connectivity returns.

**Scope:**

- Progressive Web App manifest and service worker
- Offline cache for: current trip's timeline events, today's Daily Board, trip documents (metadata, not file bytes)
- Local-first journal entry drafts (IndexedDB or equivalent)
- Background sync when connection restores
- "Add to Home Screen" prompt
- Offline banner with clear status indicator
- Photo upload queue (retries when connectivity returns)

**Definition of done:**
- Open the Daily Board on a plane with airplane mode → content loads from cache.
- Write a journal entry offline → appears in local draft state, syncs within 30 seconds of reconnecting.
- Service worker does not break normal online functionality.

**Note:** This is a significant engineering lift. Service worker caching strategies interact poorly with Next.js App Router. Plan for 2x the estimated effort.

---

## v1.0 — Production Hardening

**Theme:** Make it production-grade.

**Goal:** TripBoard is reliable, performant, tested, and ready for real users beyond early adopters.

**Scope:**

- Full test coverage: unit tests for pipeline, integration tests for API routes, E2E tests for critical user journeys (Playwright)
- Performance audit: database query analysis, N+1 elimination, proper indexing
- Error monitoring (Sentry or equivalent)
- Structured logging (no PII in logs)
- Virus scanning on uploaded files
- Rate limiting hardening on all API routes
- Accessibility audit (WCAG 2.1 AA target)
- Security audit (third-party or thorough internal review)
- Documentation: API docs, user help center stubs
- GDPR/CCPA: data export, account deletion, privacy policy
- Pricing model implementation (Stripe, freemium or subscription)
- Onboarding improvements based on v0.x user feedback
- Performance budget: <3s TTI on 3G, <1s API p95 response time

**Definition of done:**
- Test coverage >80% on critical paths.
- Zero high/critical findings from security audit.
- Application handles 100 concurrent users without degradation.
- Data export and account deletion work end-to-end.

---

## Future — Post-v1.0

These items are acknowledged, intentionally deferred, and will be re-evaluated after v1.0 ships.

**Native Mobile Apps (iOS / Android)**
React Native or Flutter. Shares the same API as the web app. Priority driver: push notifications for trip reminders and ingestion status. Not worth building until the web app is stable and the user base validates mobile demand.

**Real-Time Collaboration**
Shared trips with multiple users. Requires: multi-user data model, conflict resolution, access control (owner, editor, viewer roles), real-time sync (WebSocket or Liveblocks-style CRDTs). Complex; deferred until single-user model is proven.

**Direct Booking Integrations**
OAuth-based mailbox connectors (Gmail, Outlook) for automatic scanning of travel-related emails. Requires: narrow scope OAuth, domain-filtered queries, explicit user approval of scanned domains, one-click revocation. Will be built as mailbox connector adapter implementations — the interface already exists.

**Advanced AI Features**
- Trip planning suggestions based on destination and travel history
- Anomaly detection ("your flight is 3 hours late — here's your hotel check-in deadline")
- Packing list generation
- Budget forecasting

**Corporate / Team Features**
- Shared team trips
- Admin dashboard for travel managers
- Expense approval workflows
- Integration with Concur, TravelPerk, or other corporate travel platforms

**Apple Wallet / Google Wallet Integration**
Import boarding passes and hotel keys from Wallet apps. Requires device-side integration; complex on web; likely requires native mobile first.

**Per-Country Day Tracking**
Automatic calculation of days spent in each country across all archived trips. For digital nomads and tax purposes. Data is already in the system; requires a reporting layer.
