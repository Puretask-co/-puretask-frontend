# Environment setup (Phase 2)

## Local development

1. Copy `.env.example` to `.env.local`.
2. Set these minimum values:
   - `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000`
   - `NEXT_PUBLIC_API_URL=http://localhost:4000`
   - `NEXT_PUBLIC_BASE_URL=http://localhost:3001`
   - `NEXT_PUBLIC_WS_URL=ws://localhost:4000`
3. Run `npm run dev` (frontend on `http://localhost:3001`).

## Required for production

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | Primary backend API base URL |
| `NEXT_PUBLIC_API_URL` | Compatibility API URL used by existing pages/services |
| `NEXT_PUBLIC_BASE_URL` | Public frontend base URL |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL for real-time features |
| `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` | Stripe publishable key (live, if payments enabled) |

## Optional

- Analytics: `NEXT_PUBLIC_GA_ID`
- Error tracking: `NEXT_PUBLIC_SENTRY_DSN`
- Maps: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_MAPBOX_TOKEN`
- SEO/site URL: `NEXT_PUBLIC_SITE_URL`

## CI and release mapping

- CI deploy trigger: `.github/workflows/ci.yml` dispatches `release.yml` on `main` push.
- Release workflow secrets used during build/deploy:
  - `NEXT_PUBLIC_API_BASE_URL`
  - `NEXT_PUBLIC_API_URL`
  - `NEXT_PUBLIC_BASE_URL`
  - `NEXT_PUBLIC_WS_URL`
  - `RAILWAY_TOKEN`
  - `RAILWAY_FRONTEND_SERVICE`
  - `FRONTEND_HEALTHCHECK_URL` (optional, else falls back to `NEXT_PUBLIC_BASE_URL`)

## Security

- Never commit `.env.local` or any secret file.
- Store production values in GitHub Actions/hosted environment secrets.
- See `LAUNCH_CHECKLIST.md` Phase 2 and `docs/DEPLOYMENT.md` for release requirements.
