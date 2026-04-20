# User Personas

## Overview

TripBoard's primary audience is travelers who value control over their travel data and find existing tools either too invasive (inbox scanning) or too shallow (no document retention, no post-trip value). The four personas below represent distinct usage patterns and pain points. Product decisions should be tested against all four; tradeoffs that hurt all four equally are red flags.

---

## Persona 1 — Marco, Frequent Business Traveler

**Role / Background:** Senior consultant at a professional services firm, 34 years old. Travels 2–3 weeks per month, mostly Europe and occasionally Asia. Has a corporate travel booker but also books ad hoc trips himself. Has been using TripIt Pro for two years.

**Travel Frequency:** 25–35 trips per year, mostly short (2–4 nights), some longer project deployments (2–3 weeks).

**Pain Points:**
- TripIt's inbox scanning has caused false positives — old confirmation emails pulled into wrong trips.
- Company policy restricts granting third-party inbox access, so he can't use TripIt on his work email at all.
- Receipts are scattered across his inbox, cloud storage, and physical folders. Expense reports are painful.
- Has no clear record of past trips for tax purposes or client billing.

**Goals:**
- One place to see today's logistics without switching between apps.
- Quick expense logging during the trip, not after.
- Document vault for receipts and confirmations that survives job changes (no inbox dependency).
- Post-trip export for expense reporting.

**TripBoard Value Prop:**
Explicit email forwarding solves the work-email restriction: Marco forwards from his work account to TripBoard's ingest address, no OAuth required. The Document Vault retains the actual confirmation PDFs. Expense tracking integrated with the timeline means logging a dinner receipt is one step, not three. The Archive gives him a complete record for billing.

---

## Persona 2 — Yuki, Adventure and Leisure Traveler

**Role / Background:** Freelance photographer, 28 years old. Takes 4–6 major trips per year, mostly international, mixing solo travel with friends. Uses Instagram heavily. Has tried Wanderlog and found the map-heavy interface useful for planning but useless during the actual trip.

**Travel Frequency:** 4–6 trips per year, typically 1–3 weeks each. Often in destinations with unreliable connectivity.

**Pain Points:**
- Wanderlog's itinerary becomes outdated the moment plans change on the ground.
- No good place to capture the non-plan — the detour that became the highlight, the restaurant a local recommended.
- Photos are in her camera roll, notes are in Apple Notes, bookings are in her inbox. Nothing connects.
- Looking back at a trip later is hard: she can't remember what she did on day 3.

**Goals:**
- Capture moments and feelings in real time, not just logistics.
- Link photos to specific days and places.
- Keep logistics visible but not dominant.
- A retrospective she can actually read and share with friends.

**TripBoard Value Prop:**
The Logistics/Moments split is exactly the structure Yuki needs. Logistics tracks the skeleton; Moments is where the real trip lives. The Journal Mode supports rich entries with photos and location tags. The Memory Capsule gives her a coherent narrative of the trip, not just a list of confirmed bookings.

---

## Persona 3 — Diane, Family Trip Organizer

**Role / Background:** Stay-at-home parent, 42 years old, organizes all travel for a family of four (two kids, ages 9 and 12). Plans 2–3 family trips per year, ranging from domestic road trips to international holidays. Highly organized; uses spreadsheets for trip planning now.

**Travel Frequency:** 2–3 trips per year, 1–3 weeks each. High planning complexity: multiple travelers, multiple bookings per person, age-sensitive logistics (school holidays, kids' activities).

**Pain Points:**
- Managing bookings for four people across multiple email accounts is chaotic.
- Spreadsheets are powerful but not shareable in real time with her spouse.
- Packing lists and day-by-day plans exist in different tools.
- Keeping kids' travel documents (passports, consent letters) accessible and organized is stressful.

**Goals:**
- Single consolidated view of all bookings for the family.
- Document vault for all passports, visas, insurance policies in one place.
- Day-by-day plan she can share with her spouse during the trip.
- Something that works as a family travel archive the kids can look back on.

**TripBoard Value Prop:**
The Document Vault handles the family document problem directly — passports, insurance, consent letters, all accessible from one place. The Daily Board gives a clear day view for coordinating the family's day. The Memory Capsule, especially with photos and journal entries, becomes a family travel record. (Note: real-time collaboration is post-MVP, but export and sharing features partially address Diane's coordination needs.)

---

## Persona 4 — Rafa, Digital Nomad

**Role / Background:** Remote software developer, 31 years old, slow-travels full-time. Changes locations every 1–8 weeks. Tax residency is complex; he needs records. Uses a mix of Notion, Google Sheets, and calendar apps to track his movements.

**Travel Frequency:** Continuous. Every move is a "trip." Approximately 15–25 location changes per year.

**Pain Points:**
- No tool treats slow travel as a first-class pattern. Everything assumes discrete vacation trips.
- Needs date/location records for tax and visa purposes (how many days in each country).
- Manages a complicated set of documents: multiple visas, health insurance, remote work insurance, accommodation contracts.
- Booking platforms (Airbnb, booking.com, NomadList) don't talk to each other.

**Goals:**
- Track location history over time, not just discrete trips.
- Document vault that handles visa documents, accommodation contracts, and insurance.
- Day count per country for tax calculations.
- Minimal manual entry overhead.

**TripBoard Value Prop:**
TripBoard's explicit ingestion model works well for Rafa: he can forward Airbnb and booking.com confirmations, upload visa PDFs, and have everything in one place without granting any service access to his full inbox. The Archive builds a continuous location history over time. The Expense Tracker with multi-currency support covers his international spend. (Note: per-country day count and tax reporting are future features, but the underlying data model supports it.)
