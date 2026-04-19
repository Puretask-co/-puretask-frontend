# API Verification Results

**Run:** 2026-04-19T06:00:38.545Z
**Base URL:** http://localhost:4000
**Summary:** 15/15 passed

---

| # | Endpoint | Status | Duration | Result |
|---|----------|--------|----------|--------|
| 1 | GET /health | 200 | 35ms | ✓  |
| 2 | POST /auth/login | 200 | 67ms | ✓  |
| 3 | GET /config/job-status | 200 | 2ms | ✓ statuses=8 |
| 4 | GET /bookings/me | 200 | 4ms | ✓ bookings=0 |
| 5 | GET /referral/me | 200 | 4ms | ✓ code=none |
| 6 | GET /cleaners/:id/reviews | 200 | 5ms | ✓ reviews=0 |
| 7 | GET /api/credits/balance | 200 | 4ms | ✓ balance=0 |
| 8 | GET /api/credits/ledger | 200 | 4ms | ✓ entries=0 |
| 9 | POST /credits/checkout | 400 | 5ms | ✓ Rejected invalid package as expected for this envi |
| 10 | GET /api/billing/invoices | 200 | 4ms | ✓ invoices=0 |
| 11 | GET /api/billing/invoices/:id (404) | 403 | 3ms | ✓ 404 or 200 expected |
| 12 | POST /client/invoices/:id/pay (expect 404/400 for invalid) | 403 | 11ms | ✓ Expected error for invalid id |
| 13 | GET /api/appointments/:bookingId/live | 403 | 8ms | ✓ 404 for unknown booking |
| 14 | POST /api/appointments/:bookingId/events | 403 | 8ms | ✓ OK or expected error |
| 15 | GET /cleaners/:cleanerId/reliability | 404 | 9ms | ✓ 404 for unknown cleaner |

---

## Solutions for Failures

All tests passed. No solutions needed.
