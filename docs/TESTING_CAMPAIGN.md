# Testing Campaign: End-to-End + API Verification

Systematic testing of frontend–backend integration with documented results and solutions.

---

## 1. Overview

| Phase | What | Output |
|-------|------|--------|
| **API Verification** | Script hits all backend endpoints | `docs/TEST_RESULTS.md` |
| **E2E Trust Flows** | Playwright tests (login → credits → billing → live) | HTML report |
| **Manual Smoke** | Quick human verification | Notes in Results Log |

---

## 2. Prerequisites

- Backend running on `http://localhost:4000`
- Frontend running on `http://localhost:3001`
- Test users:
  - **Client:** `client@test.com` / `TestPass123!` (or set `TEST_EMAIL`, `TEST_PASSWORD`)
  - **Cleaner:** `cleaner@test.com` / `TestPass123!` (or set `TEST_CLEANER_EMAIL`, `TEST_CLEANER_PASSWORD`)

---

## 3. Run API Verification

Tests all endpoints from [FRONTEND_TO_BACKEND_SPEC.md](./FRONTEND_TO_BACKEND_SPEC.md).

```bash
node scripts/run-api-verification.js
```

With custom config:

```bash
API_BASE=http://localhost:4000 TEST_EMAIL=client@test.com TEST_PASSWORD=YourPass node scripts/run-api-verification.js
```

**Output:** `docs/TEST_RESULTS.md` — pass/fail per endpoint + suggested solutions for failures.

---

## 4. Run E2E Tests

Requires Playwright (`@playwright/test` is already in `devDependencies`).

Recommended smoke gate:

```bash
npm run test:e2e:smoke
```

Expanded CI journey lane (auth + credits/billing):

```bash
npm run test:e2e
```

```bash
npx playwright test tests/e2e/trust
```

Full campaign (all E2E):

```bash
npx playwright test
```

Generate HTML report:

```bash
npx playwright test tests/e2e/trust --reporter=html
npx playwright show-report
```

---

## 5. Manual Smoke Checklist

| # | Flow | Steps | Expected | Pass? |
|---|------|-------|----------|-------|
| 1 | Health | Open `http://localhost:4000/health` | `{"ok":true}` | |
| 2 | Login | Login as client at `/auth/login` | Redirect to dashboard | |
| 3 | Credits | Go to `/client/credits-trust` | Balance + ledger visible | |
| 4 | Buy credits | Click Buy credits, pick package | Redirect to checkout or error | |
| 5 | Billing | Go to `/client/billing-trust` | Invoices list or empty | |
| 6 | Pay invoice | If unpaid invoice, click Pay | Success toast or error | |
| 7 | Live appointment | Go to `/client/appointments/{id}/live-trust` | State/checklist visible | |
| 8 | API test page | Go to `/api-test` | Health Check + Protected Route pass | |

---

## 6. Results Log Template

Copy and fill after each run:

```markdown
## Test Run: YYYY-MM-DD HH:MM

- **API Verification:** X/Y passed (see docs/TEST_RESULTS.md)
- **E2E Trust:** X/Y passed
- **Manual Smoke:** X/8 passed

### Failures

| Test | Error | Solution applied |
|------|-------|------------------|
| ... | ... | ... |
```

---

## 7. Solutions for Common Failures

### Connection timeout

| Cause | Solution |
|-------|----------|
| Backend not running | Start backend: `cd puretask-backend && npm run dev` |
| Wrong port | Set `NEXT_PUBLIC_API_URL=http://localhost:4000` in `.env.local` |
| Firewall/VPN | Disable or allow localhost |

### 401 Unauthorized

| Cause | Solution |
|-------|----------|
| No token | Ensure user is logged in; token in `localStorage` under `puretask_token` |
| Token expired | Re-login |
| Wrong auth header | Backend expects `Authorization: Bearer <token>` |
| Auth endpoint returns wrong shape | Backend must return `{ token, user }` from `/auth/login` |

### 403 Forbidden

| Cause | Solution |
|-------|----------|
| Wrong role | Credits/billing require **client**; post event requires **cleaner** |
| Not job participant | Live appointment requires client or cleaner assigned to that job |

### 404 Not Found

| Cause | Solution |
|-------|----------|
| Endpoint not implemented | Implement per [FRONTEND_TO_BACKEND_SPEC.md](./FRONTEND_TO_BACKEND_SPEC.md) |
| Wrong path | Use exact paths: `/api/credits/balance`, `/api/billing/invoices`, etc. |

### CORS errors

| Cause | Solution |
|-------|----------|
| Origin not allowed | Backend CORS must allow `http://localhost:3001` |
| Credentials | Backend `credentials: true`; frontend `credentials: 'include'` |

### Invalid response shape

| Endpoint | Required shape | Fix |
|----------|----------------|-----|
| `/api/credits/balance` | `{ balance, currency, lastUpdatedISO }` | Backend returns exact fields |
| `/api/credits/ledger` | `{ entries: [...] }` | Backend returns `entries` array |
| `/api/billing/invoices` | `{ invoices: [...] }` | Backend returns `invoices` array |
| `/credits/checkout` | `{ checkoutUrl }` or `{ url }` | Backend returns redirect URL |

### E2E: Login fails

| Cause | Solution |
|-------|----------|
| Test user doesn't exist | Create via `POST /auth/register` or seed script |
| Wrong credentials | Set `TEST_EMAIL`, `TEST_PASSWORD` env vars |
| Redirect path differs | Update test `toHaveURL` pattern |

### E2E: Page not found

| Cause | Solution |
|-------|----------|
| Route doesn't exist | Ensure `/client/credits-trust`, `/client/billing-trust` exist |
| Protected route redirect | Login before navigating; check `ProtectedRoute` |

---

## 8. Files Reference

| File | Purpose |
|------|---------|
| `scripts/run-api-verification.js` | API verification script |
| `docs/TEST_RESULTS.md` | Auto-generated API results |
| `tests/e2e/trust/credits-billing-trust.spec.ts` | E2E credits + billing |
| `tests/e2e/trust/live-appointment-trust.spec.ts` | E2E live appointment |
| [FRONTEND_TO_BACKEND_SPEC.md](./FRONTEND_TO_BACKEND_SPEC.md) | Endpoint contracts |
| [TRUST_BACKEND_INTEGRATION.md](./TRUST_BACKEND_INTEGRATION.md) | Auth, errors, CORS |

---

## 9. CI Integration

Current CI target for expanded journey coverage:

```yaml
# frontend .github/workflows/ci.yml
- name: Checkout backend for full-stack e2e
  uses: actions/checkout@v4
  with:
    repository: Puretask-co/puretask-backend
    ref: "${{ github.event.pull_request.base.sha || 'main' }}"
    path: backend

- name: Seed backend deterministic users
  working-directory: backend
  run: npm run seed:e2e:users

- name: Expanded e2e journey gate
  run: npm run test:e2e
```

This ensures the default CI path runs more than auth-only smoke and includes a payments-adjacent client journey (`credits-trust` + `billing-trust`).
