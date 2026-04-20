# Privacy and Security

## Privacy-First Design Principles

TripBoard's privacy commitment is not a compliance checkbox — it is a product constraint that shapes the architecture. The core principle is: **the user controls what data enters the system and when it leaves.** No background sync, no passive collection, no resale of travel data.

Specific principles:

1. **Explicit ingestion only.** Data enters TripBoard because the user explicitly sends it (forwarding an email, uploading a file, typing a form). There is no polling, crawling, or passive monitoring.

2. **No inbox scanning.** TripBoard never reads a user's inbox. Even the email forward mechanism works in the other direction: the user pushes a specific email to TripBoard, not the other way around.

3. **Minimal AI data sharing.** When documents are sent to an AI API for extraction or summarization, only the document content is sent — no account metadata, no email history, no linked data across users. The AI is a tool, not a data recipient.

4. **User-owned data.** The user can export everything at any time. They can delete everything. Nothing is retained after deletion beyond what a legal hold or regulatory requirement mandates, and those cases are disclosed.

5. **No advertising model.** TripBoard does not monetize user data. The business model is subscription. There is no ad targeting, no behavioral profiling, no third-party data sharing for marketing purposes.

---

## Data Minimization

TripBoard collects what it needs to function and nothing more.

**Collected:**
- Account credentials (email + hashed password, or OAuth provider ID and email)
- Trip data created by the user (events, documents, journal entries, expenses)
- Ingestion metadata (timestamp, source type, processing status)
- Session data (stored server-side, not in a long-lived client cookie)

**Not collected:**
- Device fingerprints
- Location beyond what the user explicitly attaches to a journal entry or event
- Browsing behavior beyond standard server access logs (which are rotated and not used for profiling)
- Analytics that include PII — all analytics events are anonymized (user ID hashed, no email, no name)

**Retention:**
- Active data: retained indefinitely while the account is active.
- Deleted data: purged from primary database within 30 days of deletion request. Object storage files purged within 7 days.
- Server access logs: 90-day retention, then deleted.
- Job queue records: purged after 72 hours post-completion.

---

## No Inbox Scanning

This is worth stating clearly in engineering terms, not just marketing terms.

TripBoard's email ingestion works via inbound email webhook. The flow:

1. User has a TripBoard ingest address (`userid+token@in.tripboard.app`).
2. The user forwards a specific email from their own email client.
3. An inbound email service (SendGrid, Postmark, etc.) receives the message at the ingest MX record and fires a POST webhook to TripBoard.
4. TripBoard processes that one email.

TripBoard does **not**:
- Hold OAuth tokens for any user's email inbox at MVP.
- Run background jobs that poll Gmail, Outlook, or any other mailbox.
- Store the user's email credentials.
- Access any email other than what the user explicitly forwards.

The mailbox connector abstraction (see `integration-strategy.md`) is designed for future use, but even when implemented, it will require explicit user authorization, use narrow OAuth scopes, and provide a one-click revocation flow.

---

## Encryption

**In transit:** All traffic uses TLS 1.2+. HTTPS is enforced; HTTP requests are redirected. HSTS header is set with a minimum 1-year max-age.

**At rest:**
- Database: encryption at rest enabled at the infrastructure level (Postgres on a managed provider with encrypted volumes, e.g., AWS RDS, Supabase, or Neon with EBS encryption).
- Object storage: S3 server-side encryption (SSE-S3 or SSE-KMS) enabled on all buckets. All objects are encrypted before storage.
- Backups: encrypted with the same key as the primary storage. Backups are not readable without the encryption key.

**Application-level encryption:** Passwords are hashed with bcrypt (minimum cost factor 12). OAuth tokens and API keys stored in environment variables, never in the database. Ingest address tokens are cryptographically random (32-byte hex), not sequential or guessable.

---

## File Storage Security

All user files (booking PDFs, journal images, export ZIPs) are stored in private S3-compatible object storage. No file is publicly accessible via a direct URL.

**Access pattern:**
1. Client requests access to a file via an authenticated API route.
2. Server verifies the user owns the document (row-level check against `userId`).
3. Server generates a pre-signed URL valid for a short duration (default: 15 minutes).
4. Client receives the signed URL and fetches the file directly from storage.
5. The signed URL expires. Subsequent access requires a new server-side generation.

**Storage key design:**
- Keys are UUID v4 values, not human-readable paths.
- The storage bucket is not publicly listed.
- No CORS wildcard (`*`) on the storage bucket. Allowed origins are explicitly enumerated.
- Bucket does not have static website hosting enabled.

**Upload security:**
- File uploads go through the API server, not directly to S3. The server validates file type, size, and ownership before storing.
- File type is validated by MIME type inspection (not just extension). A `.pdf` file that is actually an executable is rejected.
- Maximum file size enforced at the API layer (25MB for PDFs, 10MB for images at MVP).

---

## Authentication Design

**Provider:** NextAuth.js (now Auth.js) handles the auth lifecycle.

**Credential auth:**
- Email + password.
- Password stored as bcrypt hash, never in plaintext.
- Login rate-limited: 5 failed attempts per 15 minutes per IP triggers a cooldown.
- No password hint or security question.

**OAuth:**
- Google and GitHub supported at MVP.
- Only `email` and `profile` scopes requested. No calendar, no inbox.
- OAuth tokens are not stored beyond the session; they are not used for any background access.

**Sessions:**
- Server-side sessions stored in the database (via NextAuth adapter).
- Session cookie is `HttpOnly`, `Secure`, `SameSite=Strict`.
- Session duration: 30 days with sliding expiry on activity.
- On logout, server-side session is invalidated immediately (not just cookie cleared).

**JWT (API routes):**
- API routes validate the session cookie on every request.
- No long-lived API tokens at MVP (service tokens are a future feature).
- Ingest webhook authentication uses a separate shared secret (HMAC), not the session system.

---

## GDPR and CCPA Considerations

TripBoard stores personal data about EU and California residents. The following mechanisms address compliance:

**Lawful basis (GDPR):** Processing is on the basis of contract (providing the service the user signed up for). No legitimate interest or consent basis used for core features.

**Data processing transparency:**
- Privacy policy lists all categories of data collected, purposes, and retention periods.
- Third-party processors disclosed: database host, object storage provider, email provider, AI API provider (with data processing addendum where available).

**Data subject rights:**
- **Right of access:** User can export all their data at any time from Settings → Export. Export is delivered within 24 hours.
- **Right to rectification:** User can edit all data fields directly in the UI.
- **Right to erasure (right to be forgotten):** Account deletion flow permanently deletes all trip data, documents, journal entries, expenses, and the account record. Deletion is confirmed by email. Data is purged from primary storage within 30 days, from backups within 90 days.
- **Right to portability:** Export format is JSON + original files (ZIP). JSON schema is documented.
- **Right to object:** Not applicable — no processing on legitimate interest basis.

**CCPA:**
- No sale of personal information.
- "Do Not Sell" option is technically vacuous (nothing to opt out of) but will be disclosed.
- California residents can request deletion via the same account deletion flow.

---

## Data Export and Right to Deletion

**Export:**
- Available at any time from Settings → Export Data.
- Triggers an async job that compiles all user data.
- Export ZIP contains:
  - `trips.json` — all trip records
  - `events.json` — all timeline events
  - `documents.json` — all document metadata
  - `files/` — all original uploaded files
  - `journal.json` — all journal entries
  - `expenses.json` — all expense records
  - `capsules.json` — all memory capsule texts
- Download link is delivered via email (signed, expires in 48 hours).

**Deletion:**
- User initiates from Settings → Delete Account.
- Confirmation step: user must type their email address to confirm.
- Immediate effect: session invalidated, account marked as deleted, login disabled.
- Async job: all data purged from primary database within 30 days.
- Object storage: all files deleted within 7 days.
- Backups: data is excluded from future backups immediately. Historical backups containing the data are rotated out within 90 days.
- Ingest address decommissioned immediately — any forwarded emails after deletion are rejected.

---

## Threat Model

**In scope:**

| Threat | Mitigation |
|---|---|
| Unauthorized access to another user's data | Row-level userId checks on all DB queries; no shared object storage paths |
| Compromised session cookie | HttpOnly, Secure, SameSite=Strict; server-side invalidation on logout |
| Malicious file upload (malware in PDF/image) | File type validation; files served via signed URL, never executed server-side; virus scanning considered for v1.0 |
| Ingest webhook spoofing | HMAC signature validation on all inbound webhook requests |
| SQL injection | Parameterized queries via Prisma ORM; no raw string concatenation in queries |
| XSS via user content | Content Security Policy headers; React's default XSS escaping; no dangerouslySetInnerHTML with user content |
| API abuse / scraping | Rate limiting on all API routes; authentication required for all data endpoints |
| Credential stuffing | Login rate limiting; bcrypt hashing; breach notification (future) |
| Data exfiltration via AI API | Only document content sent; no cross-user data in prompts; AI provider DPAs in place |
| Insecure direct object reference | All resource IDs validated against userId before return |

**Out of scope (accepted risks at MVP):**
- Physical access to infrastructure (managed by cloud provider).
- Nation-state adversaries.
- Side-channel attacks on cryptographic operations.
- Supply chain attacks on npm dependencies (mitigated by lockfiles and audit CI, but not eliminated).
