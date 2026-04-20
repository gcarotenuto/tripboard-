# Architecture

## System Architecture Overview

TripBoard is a Next.js monolith deployed on Vercel (or a compatible Node host) backed by a PostgreSQL database, object storage (S3-compatible), and a background job queue. The architecture avoids premature microservices — everything runs as a single deployable unit until there is a concrete reason to split.

The system has five distinct subsystems: the web application (Next.js App Router), the ingestion pipeline (inbound processing), the AI extraction layer (document understanding), the storage layer (database + file storage), and the job queue (async work). These subsystems are logical boundaries within the monorepo — they are not separate services.

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                        │
│                    Next.js React App (SSR/CSR)                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS
┌───────────────────────────▼─────────────────────────────────────┐
│                     Next.js API Routes                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │  Auth Layer │  │  REST Routes │  │  Inbound Email Webhook │  │
│  │ (NextAuth)  │  │  /api/v1/**  │  │  /api/ingest/email     │  │
│  └─────────────┘  └──────┬───────┘  └──────────┬─────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                     │                            │
         ┌───────────▼────────────────────────────▼──────────┐
         │              Ingestion Pipeline                     │
         │  ┌──────────┐ ┌────────────┐ ┌─────────────────┐  │
         │  │ Classify │→│  Extract   │→│   Normalize &   │  │
         │  │ (AI/rule)│ │ (AI+OCR)   │ │   Dedup         │  │
         │  └──────────┘ └────────────┘ └────────┬────────┘  │
         └────────────────────────────────────────┼───────────┘
                                                  │
              ┌─────────────────────────────────  │  ──────────┐
              │  Storage Layer                     │            │
              │  ┌──────────────┐   ┌─────────────▼─────────┐  │
              │  │  PostgreSQL  │◄──│  Timeline Insert /     │  │
              │  │  (Prisma ORM)│   │  Document Vault Write  │  │
              │  └──────────────┘   └───────────────────────┘  │
              │  ┌────────────────────────────────────────────┐ │
              │  │  S3-compatible Object Storage              │ │
              │  │  (raw files, processed docs, exports)      │ │
              │  └────────────────────────────────────────────┘ │
              └────────────────────────────────────────────────┘
                                    │
              ┌─────────────────────▼──────────────────────────┐
              │  Job Queue (BullMQ / Redis or pg-boss)         │
              │  - parse_document  - generate_capsule          │
              │  - ocr_image       - send_export               │
              └────────────────────────────────────────────────┘
```

---

## Monorepo Structure

```
tripboard/
├── apps/
│   └── web/                    # Next.js application
│       ├── app/                # App Router pages and layouts
│       │   ├── (auth)/         # Login, register, OAuth callback
│       │   ├── (app)/          # Protected app routes
│       │   │   ├── trips/
│       │   │   ├── timeline/
│       │   │   ├── vault/
│       │   │   ├── journal/
│       │   │   ├── expenses/
│       │   │   └── daily/
│       │   └── api/            # API routes
│       │       ├── v1/         # REST endpoints
│       │       └── ingest/     # Ingestion webhooks
│       ├── components/         # Shared React components
│       ├── lib/                # Shared utilities, clients
│       └── styles/
├── packages/
│   ├── db/                     # Prisma schema, migrations, seed
│   ├── ingestion/              # Ingestion pipeline logic
│   │   ├── adapters/           # Source-specific adapters
│   │   │   ├── email.ts
│   │   │   ├── pdf.ts
│   │   │   ├── image.ts
│   │   │   ├── ics.ts
│   │   │   └── manual.ts
│   │   ├── classify.ts         # Document type classifier
│   │   ├── extract.ts          # Field extractor (AI-backed)
│   │   ├── normalize.ts        # Canonical data normalizer
│   │   └── dedup.ts            # Duplicate detection
│   ├── ai/                     # AI provider abstraction
│   │   ├── provider.ts         # Interface definition
│   │   ├── anthropic.ts        # Anthropic implementation
│   │   └── openai.ts           # OpenAI implementation (alt)
│   ├── storage/                # Storage abstraction
│   │   ├── provider.ts
│   │   ├── s3.ts
│   │   └── local.ts            # Dev/test local filesystem
│   ├── queue/                  # Job queue abstraction
│   │   ├── provider.ts
│   │   ├── bullmq.ts
│   │   └── pgboss.ts           # Postgres-backed alt (simpler infra)
│   └── types/                  # Shared TypeScript types
├── docs/
├── .env.example
└── turbo.json
```

---

## Data Flow

### Ingestion Flow (email forward example)

```
User forwards email to ingest@tripboard.app
        │
        ▼
SendGrid Inbound Parse → POST /api/ingest/email
        │
        ▼
Auth: verify shared secret (INGEST_SECRET header)
        │
        ▼
Enqueue job: parse_document { source: 'email', payload: {...} }
        │
        ▼
Job worker picks up → EmailAdapter.extract(rawEmail)
        │  ├── extracts text body
        │  ├── extracts attachments (PDF, images)
        │  └── produces RawDocument[]
        │
        ▼
classify(rawDoc) → DocumentType (flight, hotel, car, rail, insurance, receipt, other)
        │
        ▼
extract(rawDoc, type) → ExtractedFields (AI call with structured output)
        │   confidence score attached to each field
        │
        ▼
normalize(extracted) → CanonicalEvent | CanonicalDocument
        │   dates → UTC ISO 8601
        │   currency → ISO 4217 code
        │   confirmation numbers → uppercase stripped
        │
        ▼
dedup(canonical, userId, tripId) → isDuplicate? skip : proceed
        │
        ▼
db.timelineEvent.create(...)   +   db.document.create(...)
storage.put(rawFile, signedKey)
        │
        ▼
WebSocket / SSE push → UI updates timeline in real time (v0.2+)
```

---

## Key Subsystems

### Ingestion Pipeline
Defined in `packages/ingestion/`. Each source type has an adapter that implements a common interface: `RawDocument[] = await adapter.process(input)`. The pipeline is source-agnostic from the classify step onward. Adding a new source requires only a new adapter file.

### Parsing Abstraction
The `classify` and `extract` steps are decoupled. Classification can be rule-based (regex on sender domain, subject line) for common cases and AI-backed for ambiguous ones. Extraction is always AI-backed but uses a structured output schema so results are predictable. Both steps return typed outputs; the pipeline does not proceed if classification fails.

### AI Provider Abstraction
`packages/ai/provider.ts` defines `AIProvider` with two methods: `classify(text): Promise<ClassifyResult>` and `extract(text, type): Promise<ExtractionResult>`. Concrete implementations for Anthropic Claude and OpenAI GPT exist. The active provider is selected via environment variable. This keeps the pipeline testable with mock providers and allows switching without touching pipeline code.

### Storage Abstraction
`packages/storage/provider.ts` defines `StorageProvider` with `put`, `get`, `delete`, and `signedUrl` methods. S3 (or R2) is the production backend; a local filesystem backend is used in development and tests. All file references stored in the database are storage keys, never direct URLs. URLs are generated on demand, short-lived, and signed.

### Queue / Job System
Long-running work (parsing, OCR, AI extraction, export generation, capsule generation) is off-loaded to a job queue. For MVP, `pg-boss` is preferred over BullMQ because it runs on the existing Postgres instance and eliminates the need for a Redis service. If job volume grows, migrating to BullMQ + Redis is straightforward because job definitions are isolated in `packages/queue/`.

---

## Database Design Principles

- **Prisma ORM** for schema management and type-safe queries.
- **Postgres** as the only database. No Redis at MVP unless the queue requires it.
- Every table has `id` (UUID v4), `createdAt`, `updatedAt`, and `userId` (or a relation to a user-owned entity). Row-level filtering by userId is enforced at the service layer, not just the API layer.
- Soft deletes on trips and documents (`deletedAt` nullable). Hard delete available for GDPR requests.
- File metadata stored in DB; file bytes stored in object storage. Never store binary in the database.
- Migrations are forward-only. No down migrations at MVP — if a migration needs to be reverted, a new migration fixes it.

**Core tables:** `users`, `sessions`, `trips`, `timeline_events`, `documents`, `journal_entries`, `places`, `expenses`, `memory_capsules`, `ingestion_jobs`.

---

## API Design

### REST (MVP)
All API routes under `/api/v1/`. Authenticated via session cookie (NextAuth) or API key header (for ingest webhooks). JSON request/response. Standard HTTP status codes.

Key route groups:
- `GET|POST /api/v1/trips`
- `GET|PUT|DELETE /api/v1/trips/:id`
- `GET|POST /api/v1/trips/:id/events`
- `GET|POST /api/v1/trips/:id/documents`
- `GET|POST /api/v1/trips/:id/journal`
- `GET|POST /api/v1/trips/:id/expenses`
- `GET /api/v1/trips/:id/capsule`
- `POST /api/v1/ingest/email` (webhook, shared secret auth)
- `POST /api/v1/ingest/upload` (multipart, session auth)
- `GET /api/v1/export/:tripId` (triggers async export job)

Error format: `{ error: { code: string, message: string, details?: any } }`.

### WebSocket / SSE (v0.2+)
Real-time push for ingestion status updates. When a parsing job completes, the client receives a notification so the timeline updates without a page refresh. SSE is preferred over WebSocket for this use case (unidirectional, simpler, works through Vercel's streaming response support).

---

## Security Architecture

See `docs/privacy-security.md` for the full security model. Architectural highlights:

- All API routes check session before executing. No unauthenticated read of user data.
- File access requires a signed URL generated server-side. Storage keys are opaque UUIDs, not guessable paths.
- Ingest webhook authenticated via HMAC signature or shared secret — not open to the public internet without auth.
- Environment secrets (database URL, storage credentials, AI API keys, ingest secret) are never exposed to the client bundle.
- Content Security Policy headers set on all responses.
- Input validation with Zod on all API route inputs. Never pass raw user input to the database query layer.
