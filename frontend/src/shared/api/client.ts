import createClient, { type Middleware } from 'openapi-fetch'
import type { paths } from './schema'
import { formatBytes, log } from '@/shared/lab/logger'

/**
 * Same origin as the page: Vite (dev) and Vercel (prod) forward /api to Spring Boot.
 * Absolute URL so it also works where fetch has no base URL (Vitest on Node).
 */
export const API_BASE_URL = `${globalThis.location?.origin ?? 'http://localhost'}/api/v1`

const started = new WeakMap<Request, number>()

const tracing: Middleware = {
  onRequest({ request }) {
    started.set(request, performance.now())
    log('api', `→ ${request.method} ${new URL(request.url).pathname}${new URL(request.url).search}`)
    return request
  },
  async onResponse({ request, response }) {
    const ms = performance.now() - (started.get(request) ?? performance.now())
    const size = (await response.clone().arrayBuffer()).byteLength
    const queued = response.headers.get('X-Queued') === '1'
    const serverTiming = response.headers.get('Server-Timing')
    log(
      'api',
      `← ${response.status} ${request.method} ${new URL(request.url).pathname} en ${ms.toFixed(0)} ms · ${formatBytes(size)}` +
        (queued ? ' · EN COLA (sin conexión, Background Sync)' : ''),
      {
        requestId: response.headers.get('X-Request-Id'),
        serverTiming,
        cacheControl: response.headers.get('Cache-Control'),
        contentType: response.headers.get('Content-Type'),
      },
    )
    return response
  },
}

// fetch is looked up on every call (not captured at import time) so tools that replace it,
// like MSW in the tests, see every request.
export const api = createClient<paths>({ baseUrl: API_BASE_URL, fetch: (request) => globalThis.fetch(request) })
api.use(tracing)