import { routes, type VercelConfig } from '@vercel/config/v1'

// Evaluated on every Vercel build.
// Preview (dev) -> Render staging · Production (main) -> Render production
const api = process.env.API_ORIGIN
if (!api) throw new Error('Missing environment variable API_ORIGIN')

export const config: VercelConfig = {
  framework: 'vite',
  rewrites: [
    routes.rewrite('/api/(.*)', `${api}/api/$1`), // proxy to Render: same origin for the browser
    routes.rewrite('/(.*)', '/index.html'),       // SPA fallback; existing files are served first
  ],
  headers: [
    routes.header('/assets/(.*)', [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }]),
    routes.header('/sw.js', [{ key: 'Cache-Control', value: 'no-cache' }]),
    routes.header('/manifest.webmanifest', [{ key: 'Cache-Control', value: 'no-cache' }]),
  ],
}
