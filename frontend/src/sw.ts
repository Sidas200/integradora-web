/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core'
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { Queue } from 'workbox-background-sync'
import type { MessageToSW, MessageToPage } from './shared/pwa/messages'

declare const self: ServiceWorkerGlobalScope

const log = (...args: unknown[]) => console.log('%c[SW]', 'color:#B4842A;font-weight:bold', ...args)

self.addEventListener('activate', () => log('activate: Service Worker activo'))

clientsClaim()

const manifest = self.__WB_MANIFEST
self.addEventListener('install', () => log('install: precache de', manifest.length, 'archivos'))
precacheAndRoute(manifest)
cleanupOutdatedCaches()
registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html'), { denylist: [/^\/api\//] }))

registerRoute(
  ({ url, request }) =>
    request.method === 'GET' && (url.pathname.startsWith('/api/v1/news') || url.pathname === '/api/v1/achievements'),
  new StaleWhileRevalidate({
    cacheName: 'public-api',
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 }),
      {
        cachedResponseWillBeUsed: async ({ request, cachedResponse }) => {
          log(cachedResponse ? 'public-api: respuesta desde Cache Storage' : 'public-api: sin copia en caché, va a la red',
            new URL(request.url).pathname + new URL(request.url).search)
          return cachedResponse
        },
        cacheDidUpdate: async ({ request }) => {
          log('public-api: caché actualizada con la respuesta de la red', new URL(request.url).search)
        },
        fetchDidFail: async ({ request }) => {
          log('public-api: la red falló, se usa la copia guardada', new URL(request.url).search)
        },
      },
    ],
  }),
)

registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [new ExpirationPlugin({ maxEntries: 120, maxAgeSeconds: 30 * 24 * 60 * 60 })],
  }),
)

async function notify(message: MessageToPage) {
  const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
  windows.forEach((w) => w.postMessage(message))
}

const subscriptionQueue = new Queue('subscription-queue', {
  maxRetentionTime: 24 * 60, // minutos
  onSync: async ({ queue }) => {
    let entry
    let sent = 0
    log('sync: reenviando la cola subscription-queue')
    while ((entry = await queue.shiftRequest())) {
      try {
        const response = await fetch(entry.request.clone())
        sent++
        log('sync: reenviado', entry.request.method, new URL(entry.request.url).pathname, '->', response.status,
          '· estuvo en cola', Math.round((Date.now() - (entry.timestamp ?? Date.now())) / 1000), 's')
      } catch (error) {
        await queue.unshiftRequest(entry)
        log('sync: sigue sin red, se reintentará')
        throw error
      }
    }
    if (sent > 0) await notify({ type: 'SUBSCRIPTION_SENT', count: sent })
  },
})

registerRoute(
  ({ url }) => url.pathname === '/api/v1/subscriptions',
  async ({ request }) => {
    try {
      return await fetch(request.clone())
    } catch {
      await subscriptionQueue.pushRequest({ request })
      log('POST /api/v1/subscriptions sin red: guardado en IndexedDB (workbox-background-sync › requests)')
      await notify({ type: 'SUBSCRIPTION_QUEUED' })
      return new Response(null, { status: 202, headers: { 'X-Queued': '1' } })
    }
  },
  'POST',
)

self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if ((event.data as MessageToSW | undefined)?.type === 'SKIP_WAITING') void self.skipWaiting()
})
