/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== 'production';

const apiOrigin = (() => {
  const raw =
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://localhost:4000';
  try {
    return new URL(raw).origin;
  } catch {
    return 'http://localhost:4000';
  }
})();

const wsOrigin = (() => {
  const raw = process.env.NEXT_PUBLIC_WS_URL;
  if (raw) {
    try {
      return new URL(raw).origin.replace(/^http/, 'ws');
    } catch {
      /* fall through */
    }
  }
  return apiOrigin.replace(/^http/, 'ws');
})();

const sentryConnect = 'https://*.sentry.io https://*.ingest.sentry.io';
const mapboxConnect =
  'https://api.mapbox.com https://events.mapbox.com https://*.tiles.mapbox.com';
const mapboxImg =
  'https://api.mapbox.com https://events.mapbox.com https://*.tiles.mapbox.com';

const csp = [
  "default-src 'self'",
  // 'unsafe-eval' is required for Next.js Fast Refresh in development; safe to drop in prod
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval' " : ''}blob:`,
  // Tailwind injects styles; mapbox-gl injects via its CSS
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https: ${mapboxImg}`,
  "font-src 'self' data:",
  `connect-src 'self' ${apiOrigin} ${wsOrigin} ${sentryConnect} ${mapboxConnect}`,
  "worker-src 'self' blob:",
  "child-src 'self' blob:",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "manifest-src 'self'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value:
      'camera=(self), microphone=(), geolocation=(self), interest-cohort=(), payment=(self)',
  },
  // HSTS only in production; harmless on http localhost but unnecessary
  ...(isDev
    ? []
    : [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
      ]),
];

const uploadsHost = (() => {
  const raw = process.env.NEXT_PUBLIC_UPLOADS_BASE_URL;
  if (!raw) return null;
  try {
    return new URL(raw).hostname;
  } catch {
    return null;
  }
})();

const nextConfig = {
  // Run on port 3001 to avoid conflict with backend
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  compiler: {
    removeConsole: isDev ? false : { exclude: ['error', 'warn'] },
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      { protocol: 'https' as const, hostname: 'api.mapbox.com' },
      { protocol: 'https' as const, hostname: '*.tiles.mapbox.com' },
      ...(uploadsHost
        ? [{ protocol: 'https' as const, hostname: uploadsHost }]
        : []),
    ],
  },
  async redirects() {
    return [];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
