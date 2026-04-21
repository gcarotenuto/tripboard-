# TripBoard

**TripBoard is a privacy-first digital travel operating system.**

It manages the full lifecycle of a trip — from early planning through active travel to permanent archive — around three core convictions: documents are first-class objects, not ephemeral attachments; the plan and the lived experience are distinct things that both deserve structure; and your travel data belongs to you, not to a service that reads your inbox.

---

## Table of Contents

1. [What TripBoard Is (and Isn't)](#what-tripboard-is-and-isnt)
2. [How It Compares](#how-it-compares)
3. [Architecture Overview](#architecture-overview)
4. [Tech Stack](#tech-stack)
5. [Prerequisites](#prerequisites)
6. [Quick Start](#quick-start)
7. [Database Setup](#database-setup)
8. [Environment Variables](#environment-variables)
9. [Running the Apps](#running-the-apps)
10. [Module Overview](#module-overview)
11. [Project Structure](#project-structure)
12. [Contributing](#contributing)
13. [License](#license)

---

## What TripBoard Is (and Isn't)

TripBoard covers:

- **Trip planning** — destinations, date ranges, status tracking, cover images
- **Unified timeline** — dual Logistics/Moments views on the same date axis
- **Document vault** — structured storage for confirmations, visas, insurance, receipts
- **Multi-source ingestion** — email forward, PDF/image upload, manual entry, .ics import
- **Daily board** — day-view aggregation designed for use during active travel
- **Journaling** — rich text Moments with photo embeds, location tags, mood tags
- **Expense tracking** — per-trip ledger with category breakdowns
- **Post-trip archive** — Memory Capsule with AI-generated narrative, permanent document retention, shareable export

TripBoard is **not**:

- A Gmail integration that syncs your inbox in the background
- A social trip planner with collaborative maps
- A live booking engine connected to airline or hotel APIs
- A push-notification travel concierge

Ingestion is always explicit. You forward an email, upload a file, or type an entry. There is no background daemon negotiating OAuth tokens with your email provider.

---

## How It Compares

| Dimension | TripBoard | TripIt | Wanderlog |
|---|---|---|---|
| **Core focus** | Document-first travel OS with split Logistics/Moments timeline | Inbox-aggregated itinerary management | Collaborative trip planning and mapping |
| **Ingestion model** | Explicit: email forward, PDF/image upload, manual entry, .ics | Automatic inbox scanning (Gmail/Outlook OAuth) | Manual entry, link import, basic email forward |
| **Document vault** | First-class, structured vault with type, tags, and per-doc metadata | Not present — bookings extracted, source discarded | Not present |
| **Timeline model** | Dual timeline: Logistics (bookings) + Moments (journal entries) | Single flat itinerary | Combined map + list itinerary |
| **Post-trip value** | Archive + Memory Capsule with AI summary and full doc retention | Minimal — itinerary goes stale, no memory layer | Basic trip archive, no memory features |
| **Privacy model** | No inbox scanning. Explicit ingestion only. User controls all data | Inbox scanning required for core functionality | No inbox scanning, limited ingestion without it |
| **AI role** | Document classification, field extraction, confidence scoring, post-trip summarization | None (rule-based email parsing) | Basic suggestions |

The target user values privacy, appreciates structure, and wants something that still works when offline at a foreign train station.

---

## Five Killer Features

These are the capabilities that create defensible differentiation — things TripIt and Wanderlog cannot replicate without rebuilding their core.

### 1. Document Vault with Confidence Scoring

Every ingested document shows an extraction confidence score (0–100%). Documents below the threshold are surfaced in a **Needs Review** queue — clearly separated from confirmed items. Users see exactly what the AI extracted, can verify or override any field, and always know whether a piece of data came from an email, a PDF, an image, or was typed manually. No other consumer travel app exposes this layer.

### 2. Dual Timeline: Logistics vs. Moments

The same date axis powers two completely separate views with different visual languages and different purposes:

- **Logistics** — an execution checklist. Status indicators (check-in open, confirmed, needs review), source badges, confidence scores. Designed for airport corridors and hotel lobbies.
- **Moments** — a travel story. Journal entries and tagged events rendered as cards with large decorative typography. Designed for reflection, not action.

No competitor separates these concerns. TripIt only has logistics; Wanderlog blurs both.

### 3. Daily Board as Operational Home Screen

On the day of travel, the Daily Board surfaces exactly what matters: urgent reminders first, then the morning briefing, then today's schedule with event types and times, then a **Documents Ready Today** bundle that links directly to the relevant vault entries. A progress bar checklist tracks pre-departure tasks. This is a mission-critical interface — not a dashboard widget.

### 4. Explicit-Only Ingestion with Full Provenance

TripBoard never scans your inbox. Every document enters through a deliberate act: email forward to a dedicated address, PDF upload, image scan, or manual entry. Every document retains its source tag. This is a principled architectural choice, not a missing feature — and it's the entire basis of the privacy positioning.

### 5. Memory Capsule Archive

When a trip ends, TripBoard generates a permanent Memory Capsule: an AI-written narrative summary, a list of trip highlights, and a stats panel (cities, days, journal entries, total spend). The capsule is stored alongside all original documents and is never deleted. No other app in this category treats post-trip data as a first-class product — it's typically stale itinerary data that goes cold.

---

## Architecture Overview

TripBoard is a **Turborepo monorepo** with two deployable applications and three shared packages.

```
apps/
  web/     Next.js 14 frontend — App Router, React Server Components, NextAuth.js
  api/     Node.js REST + webhook API — ingestion pipeline, background jobs, AI layer

packages/
  ui/      Shared component library (React + Tailwind)
  shared/  Types, constants, utilities, Zod schemas shared across apps
  parsing/ Document parsing pipeline — email, PDF, OCR, field extraction

prisma/    Canonical schema and migrations (used by the API; web reads via the API)
docs/      Internal documentation
```

The web app never touches the database directly. All data flows through the API, which owns the Prisma client, the BullMQ job queues, and the AI abstraction layer.

### Data Flow: Document Ingestion

```
Email forward / PDF upload / Image upload
        │
        ▼
   API ingest endpoint
        │
        ├─► Store raw file in S3-compatible storage
        ├─► Enqueue parsing job (BullMQ)
        │
        ▼
   parsing/ pipeline
        ├─► Email: extract body + attachments
        ├─► PDF: extract text (pdf-parse)
        ├─► Image: OCR (Tesseract / Google Vision / Textract)
        │
        ▼
   AI abstraction layer
        ├─► Classify document type
        ├─► Extract structured fields (dates, confirmation numbers, carriers, etc.)
        └─► Confidence score → human review queue if below threshold
        │
        ▼
   Prisma → PostgreSQL
   Document + LogisticsEvent created and linked
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | Next.js 14 (App Router) |
| UI library | React 18 |
| Language | TypeScript 5 (strict mode throughout) |
| Styling | Tailwind CSS |
| API runtime | Node.js 20+ |
| Database | PostgreSQL 15+ with `pgcrypto` and `pg_trgm` extensions |
| ORM | Prisma 5 |
| Auth | NextAuth.js (Auth.js) v5 |
| Background jobs | BullMQ + Redis |
| File storage | S3-compatible (AWS S3, Cloudflare R2, MinIO, Backblaze B2) |
| AI abstraction | Provider-agnostic layer — Anthropic Claude, OpenAI, Google AI, or local |
| OCR | Tesseract.js (default) / Google Vision / AWS Textract |
| Monorepo tooling | Turborepo |
| Package manager | npm workspaces |

---

## Prerequisites

- **Node.js** >= 20.0.0
- **npm** >= 10.0.0
- **PostgreSQL** >= 15 running locally (or a connection string to a remote instance)
- **Redis** >= 7 running locally (required for BullMQ job queues)
- An **S3-compatible storage bucket** (for local dev, MinIO works — see below)
- An **AI provider API key** (Anthropic, OpenAI, or Google AI — at least one)

### Optional for local dev

- [MinIO](https://min.io/) — run a local S3-compatible server with `docker run -p 9000:9000 minio/minio server /data`
- [MailHog](https://github.com/mailhog/MailHog) or [Mailpit](https://mailpit.axllent.org/) — catch inbound email locally without a real mail server

---

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-org/tripboard.git
cd tripboard

# 2. Install all workspace dependencies
npm install

# 3. Copy environment template and fill in your values
cp .env.example .env
# → Edit .env (see Environment Variables section below)

# 4. Set up the database (creates tables and loads seed data)
npm run db:migrate
npm run db:seed

# 5. Start all apps in development mode (web + api in parallel)
npm run dev
```

The web app will be available at **http://localhost:3000**.
The API will be available at **http://localhost:3001**.

---

## Database Setup

TripBoard uses Prisma for schema management. All commands run from the monorepo root and target `prisma/schema.prisma`.

### Create and migrate the database

```bash
# Apply all pending migrations (creates the database if it doesn't exist)
npm run db:migrate
```

### Generate the Prisma client

Run this after pulling schema changes or after editing `prisma/schema.prisma`:

```bash
npm run db:generate
```

### Push schema without a migration file (prototype mode)

Useful when iterating on the schema locally before committing a migration:

```bash
npm run db:push
```

### Seed the database

Loads reference data and creates a demo user for local development:

```bash
npm run db:seed
```

### Browse data with Prisma Studio

```bash
npm run db:studio
# Opens at http://localhost:5555
```

### Shadow database

Prisma requires a separate shadow database for `migrate dev`. Set `DATABASE_URL_SHADOW` in your `.env` to a second PostgreSQL database (e.g., `tripboard_shadow`). Create it manually if it doesn't exist:

```sql
CREATE DATABASE tripboard_shadow;
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in each value before running the application. The example file is the authoritative reference — the table below covers the most important variables.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string for the primary database |
| `DATABASE_URL_SHADOW` | Yes (dev) | PostgreSQL connection string for the Prisma shadow database |
| `NEXTAUTH_SECRET` | Yes | Random secret for NextAuth.js — generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | Base URL of the web app (e.g., `http://localhost:3000`) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional | Enable Google OAuth sign-in |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | Optional | Enable GitHub OAuth sign-in |
| `STORAGE_PROVIDER` | Yes | `s3`, `r2`, `minio`, or `local` |
| `STORAGE_BUCKET` | Yes | Name of the storage bucket |
| `STORAGE_REGION` | Yes | AWS region or equivalent |
| `STORAGE_ENDPOINT` | Optional | Custom endpoint for non-AWS providers (R2, MinIO) |
| `STORAGE_ACCESS_KEY_ID` / `STORAGE_SECRET_ACCESS_KEY` | Yes | Storage credentials |
| `EMAIL_INGEST_SECRET` | Yes | Webhook secret for inbound email endpoint |
| `AI_PROVIDER` | Yes | `anthropic`, `openai`, `google`, or `local` |
| `AI_MODEL` | Yes | Model identifier (e.g., `claude-sonnet-4-6`) |
| `ANTHROPIC_API_KEY` | Conditional | Required if `AI_PROVIDER=anthropic` |
| `OPENAI_API_KEY` | Conditional | Required if `AI_PROVIDER=openai` |
| `REDIS_URL` | Yes | Redis connection string for BullMQ |
| `OCR_PROVIDER` | Yes | `tesseract`, `google-vision`, or `aws-textract` |
| `LOG_LEVEL` | No | `debug`, `info`, `warn`, or `error` (default: `info`) |
| `FEATURE_AI_EXTRACTION` | No | Toggle AI field extraction (default: `true`) |
| `FEATURE_EMAIL_INGESTION` | No | Toggle inbound email pipeline (default: `true`) |

Never commit your `.env` file. It is listed in `.gitignore`.

---

## Running the Apps

### Development (all apps in parallel)

```bash
npm run dev
```

Turborepo starts `apps/web` on port 3000 and `apps/api` on port 3001 simultaneously, with file watching and hot reload on both.

### Development (individual app)

```bash
# Web only
cd apps/web && npm run dev

# API only
cd apps/api && npm run dev
```

### Production build

```bash
npm run build
```

Turborepo builds packages in dependency order (`packages/shared` → `packages/ui` / `packages/parsing` → `apps/*`).

### Type checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

### Clean all build artifacts and node_modules

```bash
npm run clean
```

---

## Module Overview

### Trip Hub

The entry point. Lists all trips with name, destination(s), date range, cover image, and status (`planning` / `active` / `archived`). Each trip is the container for all other modules — timeline, vault, journal, expenses, and archive are all scoped to a trip.

### Unified Timeline

The core view. Two switchable perspectives on the same date axis:

- **Logistics view** — ordered list of bookings, reservations, and transport events. Shows confirmation numbers, timing, location, linked documents, and notes. Built from parsed ingestion output.
- **Moments view** — chronological journal entries, photos, and tagged locations. Represents what actually happened, not what was booked.

Cross-referencing between views is intentional: you can see the flight you missed right next to the journal entry about missing it.

### Document Vault

Structured storage for all travel documents. Every document has a type (`flight`, `hotel`, `visa`, `insurance`, `rail`, `car`, `receipt`, `other`), ingestion source, upload date, associated trip, tags, and the raw file stored in S3. Documents are linked to Logistics events where applicable and are browsable and searchable independently of the timeline.

### Import Adapters (`packages/parsing`)

The ingestion pipeline. Supported sources at MVP:

- **Email forward** — forward a confirmation to your TripBoard inbound address; processed via inbound email webhook
- **PDF upload** — direct file upload through the web app
- **Image upload** — photo of a printed document; OCR extracts text before parsing
- **Manual entry** — structured form creates a Logistics event without parsing
- **.ics import** — iCalendar file mapped to the timeline

An adapter interface exists for future OAuth mailbox connectors (Gmail, Outlook) without requiring pipeline rewiring. No live connectors are built at MVP.

### Daily Board

A day-view that aggregates all Logistics events and journal entries for a given travel day. Designed for use during active travel: shows what comes next, what needs check-in, and includes a quick-entry widget for logging a Moment on the fly.

### Journal

Rich text entry for Moments. Supports text, embedded images, location tagging, mood tagging, and links to Logistics events. Entries appear in the Moments timeline and can reference specific bookings (useful for logging delays, surprises, or itinerary changes).

### Expenses

Per-trip expense log. Each expense records amount, currency, category, date, payer, notes, and an optional receipt link to a Document Vault entry. The summary view shows spend by category and by day. Currency conversion is manual at MVP — users enter the local currency amount and optionally record the home-currency equivalent.

### Archive / Memory Capsule

When a trip is marked complete, it moves to Archive. An AI-generated Memory Capsule is created: a short narrative summary drawn from journal entries, places visited, and expenses. The capsule is read-only and stored permanently. Users can generate a shareable (but non-public by default) export, or request a full data export (JSON + files) at any time.

---

## Project Structure

```
tripboard/
├── apps/
│   ├── web/                        # Next.js 14 frontend
│   │   └── src/
│   │       ├── app/                # App Router pages and layouts
│   │       ├── components/         # Page-level React components
│   │       ├── lib/                # Client-side utilities, API client, auth config
│   │       └── styles/             # Global CSS, Tailwind config
│   │
│   └── api/                        # Node.js REST + webhook API
│       └── src/
│           ├── adapters/           # Import adapters (email, PDF, image, .ics)
│           ├── jobs/               # BullMQ job definitions and workers
│           ├── lib/                # Shared API utilities, AI abstraction layer
│           ├── middleware/         # Auth, rate limiting, request validation
│           ├── routes/             # Express/Fastify route handlers
│           └── services/           # Business logic (trips, documents, expenses, etc.)
│
├── packages/
│   ├── ui/                         # Shared React component library
│   │   └── src/                    # Buttons, forms, modals, timeline components
│   │
│   ├── shared/                     # Cross-app types, constants, Zod schemas
│   │   └── src/
│   │
│   └── parsing/                    # Document parsing pipeline
│       └── src/                    # Field extractors, classifiers, OCR adapters
│
├── prisma/
│   ├── schema.prisma               # Canonical database schema
│   ├── seed.ts                     # Seed script for local development
│   └── migrations/                 # Versioned migration history
│
├── docs/
│   ├── differentiation.md          # Competitor analysis and positioning
│   └── mvp-scope.md                # MVP module definitions and success criteria
│
├── .env.example                    # Environment variable template
├── package.json                    # Root workspace manifest
├── tsconfig.seed.json              # TypeScript config for seed script
└── turbo.json                      # Turborepo pipeline configuration
```

---

## Contributing

### Branch conventions

- `main` — production-ready code; protected, requires PR
- `dev` — integration branch for in-progress work
- Feature branches: `feat/<short-description>`
- Bug fix branches: `fix/<short-description>`

### Development workflow

1. Fork the repository and create a branch from `dev`
2. Install dependencies: `npm install`
3. Set up your local environment: `cp .env.example .env`
4. Run the full setup: `npm run db:migrate && npm run db:seed`
5. Make your changes
6. Run type checking and lint before committing: `npm run type-check && npm run lint`
7. Open a pull request against `dev` with a clear description of the change and its motivation

### Commit style

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(vault): add tag filtering to document vault search
fix(parsing): handle missing MIME type on PDF attachments
chore(deps): update Prisma to 5.11.0
```

### Schema changes

Any change to `prisma/schema.prisma` must include a migration:

```bash
npm run db:migrate
# Prisma will prompt for a migration name — use a short, descriptive slug
# e.g., "add_expense_receipt_link"
```

Commit both the schema change and the generated migration file together.

### Adding a new import adapter

1. Create a new adapter in `packages/parsing/src/adapters/`
2. Implement the `DocumentAdapter` interface (see `packages/parsing/src/adapters/index.ts`)
3. Register the adapter in the API's `src/adapters/` routing layer
4. Add tests covering the happy path and common malformed-input cases
5. Update the Module Overview in this README if the source type is new

### Code style

- TypeScript strict mode is enforced — no `any` escapes without an explicit comment
- Imports are absolute within each app/package (configured via `tsconfig.json` paths)
- No inline `console.log` in committed code — use the structured logger in `apps/api/src/lib/logger.ts`

### Reporting issues

Open a GitHub Issue with:
- A clear description of the bug or feature request
- Steps to reproduce (for bugs)
- Expected vs. actual behavior
- Relevant environment details (Node version, OS, browser)

---

## License

MIT License

Copyright (c) 2024 TripBoard Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
