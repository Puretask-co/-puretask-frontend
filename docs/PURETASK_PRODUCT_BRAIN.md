# PureTask Product Brain

**Single source of truth for product, flows, and system design.**  
When code or another doc conflicts with this file, **update this file immediately** (Canon Rule).  
Every substantive change gets a dated entry in the Change Log below.

---

## Canon Rule & Change Log

- **Canon Rule:** If the Product Brain conflicts with code or another doc, update the Product Brain first (or in the same PR as the code change). This doc wins for product intent.
- **Change Log:**
  - **2026-02-26** — Initial Product Brain created. Structure: summary, objects, flows, pricing, policies, notifications, integrations, automations, frontend map, DB map, KPIs, open decisions.
  - **2026-02-26** — CTO hardening: Booking vs Job canon, status/terminal alignment, escrow definition, card vs credit flow, Section 13 Invariants, Authoritative constants, Escrow lifecycle, dispute timing, reliability/gamification coupling.

---

## 0. Canonical entity: Booking vs Job

**Decision:** One entity, two names for historical/audience reasons.

- **Canonical term:** **Booking** (customer-facing). The same entity is often called **job** in execution/cleaner/API contexts.
- **Canonical ID:** **booking_id**. Use this everywhere in persistence and APIs. Routes may still use `jobId` (e.g. `/jobs/:jobId`, `/tracking/:jobId`) where the execution context is clearer; treat `jobId === booking_id` (one booking = one job instance).
- **Relationship:** There is no separate “contract” vs “execution” entity. One booking = one cleaning engagement = one job. If the product later supports one booking with multiple visits, that would be a new model (e.g. booking with multiple job_slots); until then, booking and job are the same record.

---

## 1. One-paragraph product summary

**PureTask** is a marketplace connecting **clients** who need cleaning with **cleaners** who perform the work. Clients book jobs, pay via **credits** (pre-purchased) or card (with surcharge); funds are held in **escrow** until the client approves the job, then released to the cleaner. The platform enforces **reliability scoring**, **dispute resolution**, **gamification** (cleaner levels, goals, rewards), and **trust signals** (GPS check-in, before/after photos, ledger transparency). It wins on clarity of money flow, accountability, and cleaner motivation.

---

## 2. Core objects

| Object | Description |
|--------|-------------|
| **User** | Base identity; has role: `client`, `cleaner`, or `admin`. Auth via JWT; optional Google OAuth. |
| **Client** | Books jobs, holds credits balance, pays for jobs (credits or card), approves or disputes completed jobs. |
| **Cleaner** | Accepts jobs, checks in (GPS), uploads before/after photos, submits for approval; earns payouts; has reliability tier and gamification level/badges. |
| **Booking** | One cleaning engagement (canonical entity; same as “job” in APIs). ID = **booking_id**. Status: pending → accepted/scheduled → on_my_way → in_progress → awaiting_approval → **terminal:** completed | cancelled; or disputed → (admin) completed | cancelled. See [CANONICAL_JOB_STATUS.md](./CANONICAL_JOB_STATUS.md). Tied to ledger escrow/release. |
| **Credits** | In-app currency. Client buys credits (packages); balance is debited when booking (escrow) and released or refunded on approve/dispute resolution. |
| **Ledger** | Immutable log of credit movements: deposit, spend (escrow hold), refund, bonus, fee. Each entry has type, amount, status (pending/posted/reversed), relatedBookingId. Escrow = posted **spend** with relatedBookingId; release = compensating entry (cleaner credit or client refund). |
| **Dispute** | Client opens from awaiting_approval; admin resolves (release to cleaner or refund to client). Compensating ledger entries applied. |
| **Invoice** | Billing record per job or top-up; receiptUrl, lineItems, payment method. |
| **Reliability score** | Cleaner metric (0–100, tier: Excellent/Good/Watch/Risk); drives matching and trust UI. |
| **Gamification** | Cleaner levels, goals, rewards, badges; admin configures goals/rewards/choices/flags. |

---

## 3. Core flows

1. **Client buys credits** → Choose package → POST `/credits/checkout` (idempotency key) → Stripe Checkout → redirect success/cancel → balance & ledger updated.
2. **Client books job** → Search/select cleaner → Booking wizard → POST `/bookings` or `/jobs` → Credits held (escrow) or card charged (with surcharge) → Job pending.
3. **Cleaner accepts** → POST `/jobs/:id/transition` (event_type: job_accepted) → Job accepted/scheduled.
4. **Cleaner does job** → En route → Check-in (GPS) → Before/after photos (POST `/uploads/sign`, PUT, POST `/jobs/:id/photos/commit`) → Submit → Job awaiting_approval.
5. **Client approves or disputes** → Approve: POST `/tracking/:jobId/approve` → Escrow released to cleaner, ledger entries posted. Dispute: POST `/tracking/:jobId/dispute` → Disputed; admin resolves → release or refund + ledger.
6. **Cleaner payout** → Earnings accrue; request payout (POST `/payouts/request`); backend pays to cleaner’s linked account (Stripe Connect or similar).

---

## 4. Pricing + tiers

- **Credits:** Sold in packages; one credit = fixed cent value (`CENTS_PER_CREDIT`). Client pays in credits for jobs; escrow holds credits until approval.
- **Card payment:** If client pays by card for a job (not credits), a **surcharge** applies (`NON_CREDIT_SURCHARGE_PERCENT`). Card flow: **authorize** at booking, **capture** on client approval (or **void** on cancel); on dispute, admin resolution triggers Stripe **refund** as needed. Ledger: credit-based jobs have full ledger entries; card-only jobs may have ledger entries for platform accounting (backend must define).
- **Cleaner reliability tier:** Derived from reliability score (e.g. Excellent / Good / Watch / Risk). Used for ranking and trust UI; **does not** directly affect payout amount. Admin can override/pause; reliability is recomputed per backend schedule (e.g. nightly).
- **Cleaner gamification:** Levels and goals (e.g. on-time rate, add-ons completed); rewards (e.g. Priority Visibility) granted by admin or rules. **Does not** affect matching algorithm unless product explicitly decides otherwise. No direct price; affects visibility/motivation.

### 4.1 Authoritative constants (backend env)

Define these in backend env; frontend may consume where needed. Use TBD until backend locks values.

| Constant | Description | Example / TBD |
|----------|-------------|---------------|
| `CENTS_PER_CREDIT` | USD cents per one credit | e.g. 10 |
| `NON_CREDIT_SURCHARGE_PERCENT` | Surcharge when client pays by card for job | e.g. 2.5 |
| `DISPUTE_WINDOW_HOURS` | Hours client has to approve or dispute after job submitted | e.g. 72 |
| `AUTO_APPROVE_AFTER_HOURS` | If no client action, auto-approve after this many hours (0 = disabled) | TBD |
| `CANCELLATION_FREE_WINDOW_HOURS` | Cancel free of penalty within this many hours of start | TBD |
| `NO_SHOW_THRESHOLD_MINUTES` | Cleaner no-show if not checked in within this many minutes of scheduled start | TBD |

### 4.2 Escrow lifecycle (credits)

- **On booking (credits):** Create ledger entry: `type=spend`, `amount=-X`, `status=posted`, `relatedBookingId=booking_id`. Client balance decreases by X (escrow hold).
- **On client approval:** Create ledger entry (cleaner side or internal): release to cleaner earnings; client ledger may show `type=spend` as final. Net: one escrow debit, one cleaner credit; system sum = 0 (excluding platform fee if any).
- **On dispute → admin release to cleaner:** Same as approval; ledger entries for release to cleaner.
- **On dispute → admin refund to client:** Create ledger entry: `type=refund`, `amount=+X`, `relatedBookingId=booking_id`. Client balance restored.
- **On cancellation (before completion):** Reverse escrow: refund entry so client balance restored; no cleaner credit.
- **Partial release/refund:** Not in scope for v1; full release or full refund only. If product adds partial resolution, define in an invariant update.

---

## 5. Policies

- **Refunds:** Via dispute resolution (admin) or cancellation before job start; compensating ledger entries (refund type).
- **Disputes:** Client opens from awaiting_approval. **Dispute timing:** Client has `DISPUTE_WINDOW_HOURS` to approve or dispute. If `AUTO_APPROVE_AFTER_HOURS` > 0 and client does nothing, job auto-transitions to completed and escrow releases; otherwise job remains awaiting_approval until client or admin acts. Admin resolves disputed jobs (release to cleaner or refund to client).
- **Cancellations:** Client or cleaner can cancel before/during job; allowed transitions in [CANONICAL_JOB_STATUS.md](./CANONICAL_JOB_STATUS.md). Refund policy per cancellation timing; `CANCELLATION_FREE_WINDOW_HOURS` defines penalty-free window.
- **Lateness / no-shows:** Backend policies (e.g. auto-cancel, no-show detection); workers/schedules enforce. Frontend shows status and messaging.
- **Idempotency:** All “charge money” actions (create-intent, confirm, credits checkout, add payment method) send `Idempotency-Key` (UUID) so retries do not double-charge.

---

## 6. Notifications

- **Channels:** Email, SMS (Twilio), push (OneSignal or similar) — configurable per backend.
- **Triggers:** Booking confirmed, cleaner en route, job submitted (approve/dispute), dispute resolved, payout sent, review request, etc.
- **Templates:** Stored in backend; admin may manage (e.g. template library). Frontend does not send notifications; it consumes notification list and preferences (GET/PATCH `/notifications`, `/notifications/preferences`).

---

## 7. Integrations

| Integration | Purpose |
|-------------|---------|
| **Stripe** | Payment intents, checkout for credit packages, payment methods; Connect for cleaner payouts. |
| **Twilio** | SMS (verification, reminders, alerts). |
| **SendGrid / email** | Transactional email. |
| **OneSignal (or similar)** | Push notifications. |
| **Mapbox** | Maps, directions (cleaner app). |
| **Socket.IO** | Real-time: messaging, live job presence; client joins `join_booking` for job-scoped messages. |

---

## 8. Automations

- **Workers (backend):** CRON/scheduler runs: auto-cancel stale jobs, reminders, no-show detection, photo cleanup, reliability recalcs, KPI snapshots, backups. Optional Redis-backed rate limiting and job queue.
- **n8n / Base44:** Optional workflow automation; keep in sync with [CANONICAL_JOB_STATUS.md](./CANONICAL_JOB_STATUS.md) for status/transitions.
- **Frontend:** No background jobs; polling or WebSocket for live updates (e.g. tracking, messages).

---

## 9. Frontend map

- **Stack:** Next.js 16 (App Router), React Query, Zustand, Axios, Socket.IO client, Tailwind v4, Sentry.
- **Routes (key):** See [PAGE_FLOWCHARTS.md](./PAGE_FLOWCHARTS.md). Summary:
  - **Guest:** `/`, `/auth/*`, `/search`, `/help`, `/terms`, `/privacy`, `/cleaner/onboarding`.
  - **Client:** `/client` (hub), `/client/book`, `/client/bookings`, `/client/bookings/[id]`, `/client/credits-trust`, `/client/billing-trust`, `/client/settings`, `/client/support`, `/client/recurring`, `/booking`, `/booking/confirm/[id]`, `/client/job/[jobId]`, `/client/job/[jobId]/dispute`, `/client/appointments/[id]/live-trust`, `/favorites`, `/reviews`.
  - **Cleaner:** `/cleaner` (hub), `/cleaner/today`, `/cleaner/jobs/requests`, `/cleaner/jobs/[id]`, `/cleaner/job/[jobId]/workflow`, `/cleaner/job/[jobId]/tracking`, `/cleaner/job/[jobId]/upload`, `/cleaner/earnings`, `/cleaner/calendar`, `/cleaner/availability`, `/cleaner/profile`, `/cleaner/progress`, `/cleaner/goals`, `/cleaner/rewards`, `/cleaner/badges`, etc.
  - **Admin:** `/admin`, `/admin/dashboard`, `/admin/users`, `/admin/bookings`, `/admin/disputes`, `/admin/finance`, `/admin/gamification`, `/admin/support`, `/admin/settings`, `/admin/tools`.
  - **Shared:** `/messages`, `/notifications`, `/referral`.
- **Key components:** Layout (Header, Footer, MobileNav, PageShell), Auth (ProtectedRoute, AuthShell), Trust (TrustBanner, NextActionCard, JobStatusRail, ReliabilityRing), Booking (BookingStepper, CreditsCounter), Messaging (ChatWindow with join_booking + mark-read on open).

---

## 10. Database map (backend)

- **Scope:** Backend owns 103+ tables; frontend consumes API only.
- **Key concepts:** Users, roles; jobs/bookings with status and timeline; credits_ledger (entries for deposit, spend, refund, etc.); balances; payments (Stripe IDs); disputes; notifications; gamification (goals, rewards, levels, badges). Ledger invariants: every escrow/release/refund has corresponding entries; balance = sum of posted entries (per backend rules).

---

## 11. Analytics / KPIs

- **Backend:** Tracks revenue, active jobs, disputes, user counts, cleaner reliability, gamification metrics; dashboard and reports.
- **Frontend:** Admin dashboard shows stats (users, jobs, revenue, disputes); real-time metrics and alerts when backend exposes them. Client/cleaner dashboards show personal stats and next actions.

---

## 12. Open decisions / TODOs

- Align all frontend API paths to one prefix (e.g. `/api/v1` vs no prefix) with backend mount.
- E2E test: full ledger lifecycle (create job → escrow → complete → release → assert balance/ledger).
- Backend: ensure workers run in production (cron/scheduler) and Sentry/rate limiting configured.
- Optional: Supabase/n8n “memory” layer to sync Product Brain / specs for retrieval (see Level 3/4 in external memory guide).

---

## 13. System invariants

These rules must hold. Backend and frontend must enforce them; tests should assert them. Violations indicate bugs or missing logic.

### Ledger invariants

- Sum of all posted ledger entries for a user (by user_id) = that user’s balance. No balance without a supporting ledger history.
- Every escrow (spend with relatedBookingId) must have exactly one corresponding release or refund outcome: either one release-to-cleaner (job completed) or one refund-to-client (dispute or cancel). No orphan escrow.
- **Completion rule:** Every booking that reaches `completed` (or release-to-cleaner) must have: exactly one escrow debit entry and exactly one release entry; net system sum for that booking = 0 (excluding any platform fee). No booking may reach status `completed` without a ledger release entry (and no double-release). No booking may be refunded without a refund ledger entry.
- Partial release/refund is out of scope for v1; full only.

### Status invariants

- Only allowed transitions defined in [CANONICAL_JOB_STATUS.md](./CANONICAL_JOB_STATUS.md) are valid. Backend returns 400 for any other transition.
- **Terminal states:** `completed` and `cancelled` have no outgoing transitions. `disputed` has exactly two: admin may transition to `completed` or `cancelled` only.
- Every status change must create a timeline event (for audit and UI stepper).

### Payment invariants

- Every money-moving endpoint (create-intent, confirm, credits checkout, add payment method, job charge) requires `Idempotency-Key` header. Backend deduplicates by key; no double charge.
- Stripe charge/payment_intent ID must be stored on the payment record. Refunds must reference the original payment/charge ID.

### Messaging invariants

- Client must emit `join_booking` (with booking_id) before receiving real-time messages for that booking. Backend may require room membership for job-scoped messages.
- Mark-read (per message or read-all for conversation) must update unread count atomically so list and badge stay in sync with server.

---

## Document status & backend alignment

- **Product Brain is the product/design source of truth.** Implementation (backend and frontend) may lag or differ; when it does, either update this doc or add an exception in Open decisions.
- **Card flow (authorize → capture on approval):** This is the recommended pattern for escrow-like behavior. If the backend captures at booking time instead, document that here and ensure dispute/cancel refund behavior is defined.
- **Ledger entry types and lifecycle (§ 4.2, § 13):** Must match backend (e.g. `spend` vs `escrow_hold`). When backend schema is final, update this doc so tests and audits can assert against it.

---

## Quick reference: where to look

| Topic | Primary doc(s) |
|-------|----------------|
| Job status & transitions | [CANONICAL_JOB_STATUS.md](./CANONICAL_JOB_STATUS.md) |
| API endpoints | [BACKEND_ENDPOINTS.md](./BACKEND_ENDPOINTS.md) |
| Trust (credits, ledger, billing) | [TRUST_BACKEND_INTEGRATION.md](./TRUST_BACKEND_INTEGRATION.md), [TRUST_API_INTEGRATION.md](./TRUST_API_INTEGRATION.md) |
| Frontend routes & flows | [PAGE_FLOWCHARTS.md](./PAGE_FLOWCHARTS.md), [APP_FLOWS.md](./APP_FLOWS.md) |
| System audit (idempotency, ledger test, messaging) | [SYSTEM_AUDIT_7_IMPROVEMENTS.md](./SYSTEM_AUDIT_7_IMPROVEMENTS.md) |
| Gap (backend vs frontend) | [BACKEND_FRONTEND_GAP_ANALYSIS.md](../BACKEND_FRONTEND_GAP_ANALYSIS.md) |
