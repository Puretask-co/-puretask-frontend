# Frontend vs Backend: Remaining Work

## P0.1 status (2026-04-19)

- Canonical contract source: `puretask-backend/docs/active/BACKEND_ENDPOINTS.md`.
- Frontend mirror: `docs/BACKEND_ENDPOINTS.md`.
- This file now tracks only unresolved contract and integration gaps.

---

This document splits each incomplete or started-but-not-finished item into **what the frontend must do** and **what the backend must do**, with concrete steps.

---

## 5. Work that is not completed

### 5.1 Contract verification hardening (API verifier)

| Where | Who | What needs to happen |
|-------|-----|----------------------|
| **`scripts/run-api-verification.js`** | **Frontend** | Keep assertions strict and contract-aligned: validate real endpoint response envelopes for `/bookings/me`, `/cleaners/:id/reviews`, `/referral/me`, and `/config/job-status` where applicable. Keep unknown-resource tests expecting safe auth/ownership responses (403/404). |
| | **Backend** | Preserve current response contracts and avoid undocumented shape drift for endpoints used by frontend services/hooks. |

**Summary:** Contract docs are aligned; this item focuses on keeping verification strict as contracts evolve.

---

### 5.2 Referral page data parity

| Where | Who | What needs to happen |
|-------|-----|----------------------|
| **Referral stats shape** | **Backend** | Optionally expand `GET /referral/me` to include richer referral activity fields used by frontend cards/tables, or publish explicit mapping guidance for current fields. |
| | **Frontend** | Replace static fallback referral summary with fully API-driven values once backend publishes final shape for activity history and reward lifecycle details. |

**Summary:** Invite send flow is wired; remaining work is improving referral analytics parity.

---

### 5.4 Error reporting (Sentry / ErrorBoundary)

| Where | Who | What needs to happen |
|-------|-----|----------------------|
| **Error tracking** | **Backend** | Not required for this item. (Backend may have its own error logging.) |
| | **Frontend** | In `src/lib/errorHandler.ts`: when handling errors, call Sentry (or your chosen service), e.g. `Sentry.captureException(error)` with optional context. Ensure `Sentry.init` is called at app boot (e.g. in root layout or a dedicated `monitoring/sentry.ts`). In `src/components/error/ErrorBoundary.tsx`: in the error fallback or in a `componentDidCatch`/error effect, call the same reporting (e.g. `Sentry.captureException(error)`). Add env var for DSN if not already (e.g. `NEXT_PUBLIC_SENTRY_DSN`). |

**Summary:** Frontend-only. Wire existing error handler and ErrorBoundary to Sentry (or another provider); no backend change.

---

### 5.5 Tests (failing suites)

| Where | Who | What needs to happen |
|-------|-----|----------------------|
| **Failing tests** | **Backend** | Not involved. |
| | **Frontend** | Fix or document each failing suite: **ToastContext** – fix async/timing or mock toast provider. **ErrorBoundary** – mock or trigger error in a way the test can assert. **Header** – fix role/nav assertions or mocks. **Onboarding steps** – fix async or DOM assertions. **useBookings** – mock `GET /bookings/me` or adapter so hook returns expected shape. **WebSocketContext** – mock socket or skip if not critical. **AuthContext integration** – ensure provider and mocks match. **NotificationContext** – same. **InsightsDashboard** – fix data mocks or assertions. Optionally mark non‑critical tests with `it.skip` and a TODO referencing `docs/TODOS.md` until fixed. |

**Summary:** Frontend-only. Improve mocks, async handling, or skip with TODOs; no backend work.

---

## 6. Work that was started but not finished

### 6.1 Booking list (“my bookings”) — status

| Who | What needs to happen |
|-----|----------------------|
| **Backend** | Endpoint is implemented with real client booking rows and cleaner summary. Keep pagination/filter semantics stable if they are introduced. |
| **Frontend** | Already wired via `bookingService.getMyBookings`; adjust only if backend introduces explicit pagination metadata. |

---

### 6.2 Cleaner job detail: check-in and photo upload — status

| Who | What needs to happen |
|-----|----------------------|
| **Backend** | Tracking check-in/check-out and photo commit endpoints are available. Maintain ownership + validation invariants. |
| **Frontend** | Cleaner tracking flows are wired to `/tracking/:jobId/check-in` and `/tracking/:jobId/check-out`; keep UX and error handling aligned with backend validations. |

---

### 6.3 Cleaner calendar: derive bookings from API — status

| Who | What needs to happen |
|-----|----------------------|
| **Backend** | Keep assigned jobs / schedule endpoints stable and documented. |
| **Frontend** | Calendar is using assigned jobs data; refine mapping and month labels as UX polish, not contract blocking. |

---

### 6.4 Cleaner availability: success toast after action — status

| Who | What needs to happen |
|-----|----------------------|
| **Backend** | Nothing. |
| **Frontend** | Success toasts are wired for schedule/time-off/preference updates; keep them consistent during future refactors. |

---

### 6.5 CleanerCard “Add to favorites” — status

| Who | What needs to happen |
|-----|----------------------|
| **Backend** | Favorites endpoints are available; keep response/error semantics stable. |
| **Frontend** | Feature is wired in `CleanerCard`; optional enhancement is persistent “already favorited” state rendering. |

---

### 6.6 Admin disputes: resolve endpoint

| Who | What needs to happen |
|-----|----------------------|
| **Backend** | Implement **POST /admin/jobs/:id/resolve-dispute** (or **POST /admin/disputes/:id/resolve** – align with what the frontend calls). Request body should include resolution details (e.g. `{ outcome: 'client_refund' \| 'cleaner_win' \| 'split', amount?: number, reason?: string }`). Backend updates dispute status, applies refunds/payouts if needed, and returns success. |
| **Frontend** | **Nothing.** Already calls `apiClient.post(\`/admin/jobs/${dispute.id}/resolve-dispute\`, data)` in `src/app/admin/disputes/page.tsx`. Ensure the `data` shape matches what the backend expects (outcome, amount, reason, etc.). If the backend chooses a different path (e.g. `/admin/disputes/:id/resolve`), change the URL in that mutation to match. |

**Summary:** Backend implements the resolve endpoint; frontend may only need a URL or body tweak to match backend contract.

---

### 6.7 Gamification data (feature-flagged behavior)

| Who | What needs to happen |
|-----|----------------------|
| **Backend** | Gamification routes exist but may return disabled/empty payloads when `gamification_enabled` is false. Keep this behavior explicit in contract docs. |
| **Frontend** | Treat empty gamification payloads under disabled flags as expected behavior, not API failures. |

**Summary:** Remaining work is product rollout and enablement policy, not missing route plumbing.

---

### 6.8 Trust / main live backend — status

| Who | What needs to happen |
|-----|----------------------|
| **Backend** | Trust live endpoints are mounted (`/api/appointments/:bookingId/live`, `/api/appointments/:bookingId/events`) and main app live route is available (`/client/jobs/:bookingId/live-status`). |
| **Frontend** | Continue using label-merge behavior for Trust checklist data and keep endpoint assumptions synced with `docs/BACKEND_ENDPOINTS.md`. |

**Summary:** Core live endpoints are in place; remaining risk is contract drift, addressed by `test:api`.

---

### 6.9 Job Details / Tracking (single-call DTO) — status

| Who | What needs to happen |
|-----|----------------------|
| **Backend** | `GET /jobs/:jobId/details` is implemented with ownership guard and composite payload; keep response shape stable for frontend consumers. |
| **Frontend** | Details + tracking flow is wired. Keep fallback logic only as resilience, not as primary path. |

**Summary:** This integration is complete and should be treated as contract-protected.

---

## Quick reference table

| Item | Backend | Frontend |
|------|---------|----------|
| GET /bookings/me | Implemented (real data) | Wired |
| GET /cleaners/:id/reviews | Implemented (real data) | Wired |
| Referral send | Implemented (`POST /referral/send`) | Wired |
| Referral stats parity | Optional richer fields | Replace static fallback when shape is finalized |
| Job check-in/check-out | Implemented (`/tracking/:jobId/...`) | Wired |
| Job photo commit flow | Implemented (`/uploads/sign`, `/jobs/:jobId/photos/commit`) | Wired |
| Cleaner calendar data | Available via assigned jobs/schedule | Wired |
| Cleaner availability toasts | N/A | Wired |
| Favorites add/remove/list | Implemented | Wired |
| Admin resolve dispute | Implemented alias route | Wired |
| Trust/live endpoints | Implemented | Wired |
| Job Details DTO | Implemented (`GET /jobs/:jobId/details`) | Wired + fallback |
| Contract drift prevention | Keep docs and responses aligned | Enforce via `npm run test:api` |
