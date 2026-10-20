// frontend/vercel.ts (excerpt) — evaluated on every build
const api = process.env.API_ORIGIN                  // Preview → Render staging, Production → Render production
if (!api) throw new Error('Missing environment variable API_ORIGIN')

export const config: VercelConfig = {
  framework: 'vite',
  rewrites: [
    routes.rewrite('/api/(.*)', `${api}/api/$1`),  // proxy to Render: same origin for the browser
    routes.rewrite('/(.*)', '/index.html'),        // SPA; existing files are served first
  ],
  headers: [
    routes.header('/assets/(.*)', [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }]),
    routes.header('/sw.js', [{ key: 'Cache-Control', value: 'no-cache' }]),   // detect every new SW version
  ],
}
