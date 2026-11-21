import { routes, type VercelConfig } from '@vercel/config/v1'

// Evaluated on every Vercel build.
// Preview (dev) -> Render staging · Production (main) -> Render production
const api = process.env.API_ORIGIN
if (!api) throw new Error('Missing environment variable API_ORIGIN')

// Content-Security-Policy (README §10). Everything comes from the site's own origin: bundle, fonts,
// art, trailer and the API (proxied below), so 'self' covers it; data:/blob: only for images.
// No inline scripts. 'unsafe-inline' styles: React writes style attributes (CSS variables).
// nginx/default.conf.template sends the same policy; src/app/csp.test.ts checks both.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "media-src 'self'",
  "connect-src 'self'",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ')

const SECURITY_HEADERS = [
  { key: 'Content-Security-Policy', value: CSP },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

export const config: VercelConfig = {
  framework: 'vite',
  rewrites: [
    routes.rewrite('/api/(.*)', `${api}/api/$1`), // proxy to Render: same origin for the browser
    routes.rewrite('/(.*)', '/index.html'),       // SPA fallback; existing files are served first
  ],
  headers: [
    routes.header('/(.*)', SECURITY_HEADERS),   // CSP and friends on every response
    routes.header('/assets/(.*)', [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }]),
    routes.header('/sw.js', [{ key: 'Cache-Control', value: 'no-cache' }]),
    routes.header('/manifest.webmanifest', [{ key: 'Cache-Control', value: 'no-cache' }]),
  ],
}
