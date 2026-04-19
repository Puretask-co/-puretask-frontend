#!/usr/bin/env node
/**
 * API Verification Script
 * Tests all frontend-specified backend endpoints and writes results to docs/TEST_RESULTS.md
 *
 * Usage:
 *   node scripts/run-api-verification.js
 *   API_BASE=http://localhost:4000 node scripts/run-api-verification.js
 *   TEST_EMAIL=client@test.com TEST_PASSWORD=TestPass123! node scripts/run-api-verification.js
 */

const fs = require('fs');
const path = require('path');

const API_BASE =
  process.env.API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:4000';
const TEST_EMAIL = process.env.TEST_EMAIL || process.env.E2E_CLIENT_EMAIL || 'client@test.com';
const TEST_PASSWORD =
  process.env.TEST_PASSWORD || process.env.E2E_CLIENT_PASSWORD || 'TestPass123!';
const REQUEST_ID = process.env.REQUEST_ID || `frontend-contract-${Date.now()}`;

const results = [];
let token = null;

function log(name, ok, status, durationMs, message = '', solution = '') {
  results.push({ name, ok, status, durationMs, message, solution });
  const icon = ok ? '✓' : '✗';
  console.log(`${icon} ${name} (${status} ${durationMs}ms)${message ? ': ' + message : ''}`);
}

async function fetchJson(url, opts = {}) {
  const start = Date.now();
  const res = await fetch(url, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'x-request-id': REQUEST_ID,
      'x-correlation-id': REQUEST_ID,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  const durationMs = Date.now() - start;
  let body;
  try {
    body = await res.json();
  } catch {
    body = await res.text();
  }
  return { res, body, durationMs };
}

async function run() {
  console.log('\n=== API Verification Campaign ===');
  console.log(`Base URL: ${API_BASE}`);
  console.log('');

  // 1. Health (no auth)
  try {
    const { res, durationMs } = await fetchJson(`${API_BASE}/health`);
    const ok = res.ok;
    log('GET /health', ok, res.status, durationMs, ok ? '' : res.statusText);
    if (!ok) {
      results[results.length - 1].solution =
        'Backend not running. Start backend on port 4000. Check NEXT_PUBLIC_API_URL in .env.local.';
    }
  } catch (e) {
    log('GET /health', false, 0, 0, e.message);
    results[results.length - 1].solution =
      'Connection refused or timeout. Ensure backend is running at ' +
      API_BASE +
      ' and CORS allows requests.';
  }

  // 2. Login to get token
  try {
    const { res, body, durationMs } = await fetchJson(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    });
    const ok = Boolean(res.ok && body?.token);
    if (ok) token = body.token;
    log(
      'POST /auth/login',
      ok,
      res.status,
      durationMs,
      ok ? '' : (body?.message || body?.error?.message || 'No token in response'),
      ok ? '' : 'Create test user via POST /auth/register. Ensure response includes { token, user }.'
    );
  } catch (e) {
    log('POST /auth/login', false, 0, 0, e.message);
    results[results.length - 1].solution =
      'Network error. Check backend is running. Ensure TEST_EMAIL and TEST_PASSWORD are valid.';
  }

  if (!token) {
    console.log('\nNo token — skipping authenticated endpoints.\n');
    writeReport();
    return;
  }

  // 3. Contract-specific checks (P0.1)
  try {
    const { res, body, durationMs } = await fetchJson(`${API_BASE}/config/job-status`);
    const payload = body?.data ?? body;
    const ok = Boolean(
      res.ok &&
      Array.isArray(payload?.statuses) &&
      payload?.events &&
      payload?.transitions &&
      payload?.eventPermissions
    );
    log(
      'GET /config/job-status',
      ok,
      res.status,
      durationMs,
      ok ? `statuses=${payload.statuses.length}` : (body?.message || 'Invalid canonical status payload'),
      !ok ? 'Expected canonical payload with statuses/events/transitions/eventPermissions.' : ''
    );
  } catch (e) {
    log('GET /config/job-status', false, 0, 0, e.message);
  }

  try {
    const { res, body, durationMs } = await fetchJson(`${API_BASE}/bookings/me`);
    const ok = res.ok && Array.isArray(body?.bookings);
    log(
      'GET /bookings/me',
      ok,
      res.status,
      durationMs,
      ok ? `bookings=${body.bookings.length}` : (body?.message || 'Invalid bookings shape'),
      !ok ? 'Expected `{ bookings: [...] }` for authenticated clients.' : ''
    );
  } catch (e) {
    log('GET /bookings/me', false, 0, 0, e.message);
  }

  try {
    const { res, body, durationMs } = await fetchJson(`${API_BASE}/referral/me`);
    const ok =
      res.ok &&
      (typeof body?.code === 'string' || body?.code === null) &&
      typeof body?.totalReferrals === 'number' &&
      typeof body?.pendingReferrals === 'number' &&
      typeof body?.qualifiedReferrals === 'number' &&
      typeof body?.totalEarned === 'number';
    log(
      'GET /referral/me',
      ok,
      res.status,
      durationMs,
      ok ? `code=${body.code ?? 'none'}` : (body?.message || 'Invalid referral stats shape'),
      !ok ? 'Expected referral stats shape from backend contract.' : ''
    );
  } catch (e) {
    log('GET /referral/me', false, 0, 0, e.message);
  }

  try {
    const { res, body, durationMs } = await fetchJson(`${API_BASE}/cleaners/test-cleaner-id/reviews?page=1&per_page=5`);
    const ok =
      res.ok ||
      (res.status === 404 && body?.error?.code === 'NOT_FOUND') ||
      res.status === 403;
    log(
      'GET /cleaners/:id/reviews',
      ok,
      res.status,
      durationMs,
      ok
        ? res.ok
          ? `reviews=${Array.isArray(body?.reviews) ? body.reviews.length : 0}`
          : 'Expected auth/ownership or not-found for synthetic cleaner id'
        : (body?.message || 'Unexpected error'),
      !ok ? 'Expected `{ reviews, page, per_page, total }` for valid cleaner id.' : ''
    );
  } catch (e) {
    log('GET /cleaners/:id/reviews', false, 0, 0, e.message);
  }

  // 4. Credits
  try {
    const { res, body, durationMs } = await fetchJson(`${API_BASE}/api/credits/balance`);
    const ok = res.ok && typeof body?.balance === 'number';
    log(
      'GET /api/credits/balance',
      ok,
      res.status,
      durationMs,
      ok ? `balance=${body.balance}` : (body?.message || 'Invalid shape'),
      !ok && res.status === 401
        ? 'Token invalid. Re-login. Check Authorization header is sent.'
        : !ok && res.status === 403
          ? 'Client role required.'
          : ''
    );
  } catch (e) {
    log('GET /api/credits/balance', false, 0, 0, e.message);
    results[results.length - 1].solution = 'CORS or network error. Check backend allows Origin.';
  }

  try {
    const { res, body, durationMs } = await fetchJson(`${API_BASE}/api/credits/ledger?limit=5`);
    const ok = res.ok && Array.isArray(body?.entries);
    log(
      'GET /api/credits/ledger',
      ok,
      res.status,
      durationMs,
      ok ? `entries=${body.entries.length}` : (body?.message || 'Invalid shape'),
      !ok ? 'Response must be { entries: CreditLedgerEntry[] }' : ''
    );
  } catch (e) {
    log('GET /api/credits/ledger', false, 0, 0, e.message);
  }

  try {
    const { res, body, durationMs } = await fetchJson(`${API_BASE}/credits/checkout`, {
      method: 'POST',
      body: JSON.stringify({
        packageId: 'starter',
        successUrl: 'http://localhost:3001/client/credits-trust?success=1',
        cancelUrl: 'http://localhost:3001/client/credits-trust?cancel=1',
      }),
    });
    const ok = (res.ok && (body?.checkoutUrl || body?.url)) || res.status === 400;
    log(
      'POST /credits/checkout',
      ok,
      res.status,
      durationMs,
      ok
        ? (res.status === 400 ? 'Rejected invalid package as expected for this environment' : 'checkoutUrl returned')
        : (body?.message || 'Missing checkoutUrl/url'),
      !ok
        ? 'Response must include checkoutUrl or url for redirect to payment provider.'
        : ''
    );
  } catch (e) {
    log('POST /credits/checkout', false, 0, 0, e.message);
  }

  // 5. Billing
  try {
    const { res, body, durationMs } = await fetchJson(`${API_BASE}/api/billing/invoices`);
    const ok = res.ok && Array.isArray(body?.invoices);
    log(
      'GET /api/billing/invoices',
      ok,
      res.status,
      durationMs,
      ok ? `invoices=${body.invoices.length}` : (body?.message || 'Invalid shape'),
      !ok ? 'Response must be { invoices: Invoice[] }' : ''
    );
  } catch (e) {
    log('GET /api/billing/invoices', false, 0, 0, e.message);
  }

  try {
    const { res, durationMs } = await fetchJson(
      `${API_BASE}/api/billing/invoices/test-invalid-id`
    );
    const ok = res.status === 404 || res.status === 403 || res.ok;
    log(
      'GET /api/billing/invoices/:id (404)',
      ok,
      res.status,
      durationMs,
      ok ? '404 or 200 expected' : 'Unexpected error',
      ''
    );
  } catch (e) {
    log('GET /api/billing/invoices/:id', false, 0, 0, e.message);
  }

  try {
    const { res, durationMs } = await fetchJson(
      `${API_BASE}/client/invoices/test-invalid-id/pay`,
      {
        method: 'POST',
        body: JSON.stringify({ payment_method: 'credits' }),
      }
    );
    const ok = res.status === 404 || res.status === 403 || res.status === 400 || res.status === 422;
    log(
      'POST /client/invoices/:id/pay (expect 404/400 for invalid)',
      ok,
      res.status,
      durationMs,
      ok ? 'Expected error for invalid id' : 'Unexpected response',
      ''
    );
  } catch (e) {
    log('POST /client/invoices/:id/pay', false, 0, 0, e.message);
  }

  // 6. Live appointment
  try {
    const { res, body, durationMs } = await fetchJson(
      `${API_BASE}/api/appointments/test-booking-id/live`
    );
    const ok = res.ok || res.status === 404 || res.status === 403;
    log(
      'GET /api/appointments/:bookingId/live',
      ok,
      res.status,
      durationMs,
      ok ? (res.ok ? 'OK' : '404 for unknown booking') : 'Unexpected error',
      !ok && res.status === 401 ? 'Token required. Client or cleaner role.' : ''
    );
  } catch (e) {
    log('GET /api/appointments/:bookingId/live', false, 0, 0, e.message);
  }

  try {
    const { res, durationMs } = await fetchJson(
      `${API_BASE}/api/appointments/test-booking-id/events`,
      {
        method: 'POST',
        body: JSON.stringify({
          type: 'en_route',
          gps: { lat: 37.77, lng: -122.42, accuracyM: 10 },
          source: 'device',
        }),
      }
    );
    const ok = res.ok || res.status === 404 || res.status === 403 || res.status === 501;
    log(
      'POST /api/appointments/:bookingId/events',
      ok,
      res.status,
      durationMs,
      ok ? 'OK or expected error' : 'Unexpected error',
      res.status === 501
        ? 'check_in/check_out may return 501 — use main tracking API.'
        : ''
    );
  } catch (e) {
    log('POST /api/appointments/:bookingId/events', false, 0, 0, e.message);
  }

  // 7. Reliability
  try {
    const { res, body, durationMs } = await fetchJson(
      `${API_BASE}/cleaners/test-cleaner-id/reliability`
    );
    const ok = res.ok || res.status === 404 || res.status === 403;
    log(
      'GET /cleaners/:cleanerId/reliability',
      ok,
      res.status,
      durationMs,
      ok
        ? (res.ok ? 'OK' : (res.status === 403 ? 'Expected auth/ownership rejection' : '404 for unknown cleaner'))
        : 'Unexpected error',
      ''
    );
  } catch (e) {
    log('GET /cleaners/:cleanerId/reliability', false, 0, 0, e.message);
  }

  writeReport();
}

function writeReport() {
  const passed = results.filter((r) => r.ok).length;
  const total = results.length;
  const ts = new Date().toISOString();

  let md = `# API Verification Results\n\n`;
  md += `**Run:** ${ts}\n`;
  md += `**Base URL:** ${API_BASE}\n`;
  md += `**Summary:** ${passed}/${total} passed\n\n`;
  md += `---\n\n`;
  md += `| # | Endpoint | Status | Duration | Result |\n`;
  md += `|---|----------|--------|----------|--------|\n`;

  results.forEach((r, i) => {
    const icon = r.ok ? '✓' : '✗';
    const status = r.status || '—';
    const dur = r.durationMs ?? '—';
    const msg = (r.message || '').slice(0, 50);
    md += `| ${i + 1} | ${r.name} | ${status} | ${dur}ms | ${icon} ${msg} |\n`;
  });

  md += `\n---\n\n## Solutions for Failures\n\n`;
  const failures = results.filter((r) => !r.ok);
  if (failures.length === 0) {
    md += `All tests passed. No solutions needed.\n`;
  } else {
    failures.forEach((r) => {
      md += `### ${r.name}\n`;
      md += `- **Message:** ${r.message || 'N/A'}\n`;
      md += `- **Solution:** ${r.solution || 'See TRUST_BACKEND_INTEGRATION.md and FRONTEND_TO_BACKEND_SPEC.md'}\n\n`;
    });
  }

  const outPath = path.join(__dirname, '..', 'docs', 'TEST_RESULTS.md');
  fs.writeFileSync(outPath, md, 'utf8');
  const summaryPath = path.join(__dirname, '..', 'api-verification-summary.json');
  fs.writeFileSync(
    summaryPath,
    JSON.stringify(
      {
        generatedAt: ts,
        apiBase: API_BASE,
        passed,
        total,
        failed: total - passed,
        requestId: REQUEST_ID,
        // Never persist auth tokens in artifacts/logs.
        results,
      },
      null,
      2
    ),
    'utf8'
  );
  console.log(`\nReport written to ${outPath}`);
  console.log(`Summary written to ${summaryPath}\n`);

  if (passed !== total) {
    console.error(`API verification failed: ${passed}/${total} passed.`);
    process.exitCode = 1;
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
