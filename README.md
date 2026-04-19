# PureTask Frontend

Next.js frontend for the PureTask platform.

## Quick start

### Prerequisites

- Node.js 20+
- npm

### Install

```bash
npm install
cp .env.example .env.local
```

Set local minimum env values in `.env.local`:

- `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000`
- `NEXT_PUBLIC_API_URL=http://localhost:4000`
- `NEXT_PUBLIC_BASE_URL=http://localhost:3001`
- `NEXT_PUBLIC_WS_URL=ws://localhost:4000`

### Run locally

```bash
npm run dev
```

- Dev URL: `http://localhost:3001`
- Backend should be running at `http://localhost:4000`

## Scripts

- `npm run dev` — start local dev server on `3001`
- `npm run build` — production build
- `npm run start` — production server on `3001`
- `npm run lint` — lint checks
- `npm run test` / `npm run test:coverage` — Jest tests
- `npm run test:api` — frontend/backend contract verification
- `npm run test:e2e:smoke` — Playwright smoke login
- `npm run verify:fullstack` — `test:api` + `test:e2e:smoke`

## Full-stack verification (recommended)

Backend repo (`/workspace`):

1. `npm run db:check`
2. `npm run seed:e2e:users`

Frontend repo (`/workspace/puretask-frontend`):

3. `npm run test:api`
4. `npm run test:e2e:smoke`
5. `npm run verify:fullstack`

## CI / release behavior

- CI workflow: `.github/workflows/ci.yml`
  - runs `lint`, `test:coverage`, and `build`
  - on `main` push, dispatches `.github/workflows/release.yml`
- Release workflow: `.github/workflows/release.yml`
  - accepts `environment`, `backend_ref`, `frontend_ref`, `orchestration_run_id`
  - builds and deploys to Railway, then runs health check

## Known blocker (current)

- `npm run build` currently fails due to a JSX parse error in:
  - `src/app/client/bookings/[id]/page.tsx`
- Fix this file before treating frontend build as a merge/release gate.

## Docs

- Environment setup: `docs/ENV_SETUP.md`
- Deployment: `docs/DEPLOYMENT.md`
- Launch checklist: `LAUNCH_CHECKLIST.md`
- Backend contract mirror: `docs/BACKEND_ENDPOINTS.md`
