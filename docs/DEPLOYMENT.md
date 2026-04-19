# Deployment (frontend)

## Local production-mode check

```bash
npm run build
npm run start
```

- Production server listens on `http://localhost:3001` (`start` uses `next start -p 3001`).
- Run this before release dispatch to confirm the build can boot.

## CI and release workflows

### CI (`.github/workflows/ci.yml`)

- `lint` job runs `npm run lint`
- `test` job runs `npm run test:coverage`
- `build` job runs `npm run build`
- `deploy` job (main push only) dispatches `release.yml` via:
  - `gh workflow run release.yml --field environment=production --field frontend_ref=<sha> --field orchestration_run_id=<run_id>`

### Release (`.github/workflows/release.yml`)

Manual `workflow_dispatch` workflow with inputs:

- `environment` (`production` or `staging`)
- `backend_ref` (optional, for cross-repo traceability)
- `frontend_ref` (optional, for cross-repo traceability)
- `orchestration_run_id` (optional, for cross-repo traceability)

Release steps:

1. `npm ci`
2. `npm run build`
3. Deploy to Railway (`railway up --service "${RAILWAY_FRONTEND_SERVICE}" --detach`)
4. Health probe using `FRONTEND_HEALTHCHECK_URL` (fallback: `NEXT_PUBLIC_BASE_URL`)

## Railway configuration

Set in Railway service variables:

- `RAILWAY_TOKEN`
- `RAILWAY_FRONTEND_SERVICE`
- `FRONTEND_HEALTHCHECK_URL` (recommended)
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_BASE_URL`
- `NEXT_PUBLIC_WS_URL`

Optional:

- `NEXT_PUBLIC_STRIPE_PUBLIC_KEY`
- `NEXT_PUBLIC_GA_ID`
- `NEXT_PUBLIC_SENTRY_DSN`

## Backend dependency notes

This frontend assumes backend endpoints are available. Before release promotion, run:

- Frontend: `npm run test:api`
- Frontend: `npm run verify:fullstack`

If backend and frontend are coordinated by backend orchestration, verify refs are explicit (`backend_ref`, `frontend_ref`) and validate job passes before dispatch.

## Known current blocker

- `npm run build` currently fails due to a JSX parse error in `src/app/client/bookings/[id]/page.tsx`.
- Fix this blocker before relying on frontend build as a strict release gate.
