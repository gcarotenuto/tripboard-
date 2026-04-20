# TripBoard Differentiation

## What TripBoard Is

TripBoard is a privacy-first digital travel operating system. It organizes the full lifecycle of a trip — before, during, and after — around documents, a structured timeline, and a personal journal. The core bet is that travelers don't need another service that aggregates bookings from their inbox. They need a place to own their travel data, understand their itinerary clearly, capture what actually happened, and revisit it years later.

The product is built document-first. Booking confirmations, visas, insurance policies, and receipts are first-class objects with their own vault, not ephemeral attachments. The timeline is split into two explicit views: Logistics (what's planned, what's booked) and Moments (what happened, how it felt). This separation reflects how people actually experience travel — the plan and the reality are different things, and both deserve structure.

The privacy commitment is not a feature toggle; it's a constraint that shapes every design decision. TripBoard never reads your inbox. You explicitly forward or upload documents. There is no background sync daemon negotiating OAuth tokens with Gmail. The surface area for data leakage is narrow by design, and the system is built to work even if you never connect any external account.

## Competitor Comparison

| Dimension | TripBoard | TripIt | Wanderlog |
|---|---|---|---|
| **Core focus** | Document-first travel OS with split Logistics/Moments timeline | Inbox-aggregated itinerary management | Collaborative trip planning and mapping |
| **Ingestion model** | Explicit: email forward, PDF/image upload, manual entry, .ics import | Automatic inbox scanning (Gmail/Outlook OAuth) | Manual entry, link import, basic email forward |
| **Document vault** | First-class, structured vault with tagging and per-doc metadata | Not present — bookings extracted, source discarded | Not present |
| **Timeline model** | Dual timeline: Logistics (bookings) + Moments (journal entries) | Single flat itinerary timeline | Combined map + list itinerary |
| **Post-trip value** | Archive and Memory Capsule with AI summary, full doc retention | Minimal — itinerary goes stale, no memory layer | Basic trip archive, no memory features |
| **Privacy model** | No inbox scanning. Explicit ingestion only. User controls all data | Inbox scanning required for core functionality | No inbox scanning, but limited ingestion without it |
| **AI role** | Document classification, field extraction, confidence scoring, post-trip summarization | None (rule-based email parsing) | Basic suggestions, itinerary optimization |
| **Pricing model** | TBD (freemium likely) | Freemium; Pro at ~$49/year; Teams tier | Free with Pro at ~$35/year |

## Key Positioning Statement

TripBoard is for travelers who want to own their trip data — not hand it to a service that reads their email. It does less than TripIt's inbox magic and less than Wanderlog's social-map features, but it does those things deliberately: structured documents, a clear split between logistics and lived experience, and a post-trip archive built to last. The target user values privacy, appreciates structure, and wants something that still works when they're offline in a foreign train station.
