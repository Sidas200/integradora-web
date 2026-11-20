/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core'
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { Queue } from 'workbox-background-sync'
import type { MessageToPage } from './shared/pwa/messages'
import {
  IMAGES_CACHE, isImage, isPublicApi, isSkipWaiting, isSubscription, NAVIGATION_DENYLIST, PUBLIC_API_CACHE,
  replayQueue, sendOrQueueSubscription, SUBSCRIPTION_QUEUE,
} from './shared/pwa/swRules'

declare const self: ServiceWorkerGlobalScope

const log = (...args: unknown[]) => console.log('%c[SW]', 'color:#B4842A;font-weight:bold', ...args)

self.addEventListener('activate', () => log('activate: Service Worker activo'))

clientsClaim()

const manifest = self.__WB_MANIFEST
self.addEventListener('install', () => log('install: precache de', manifest.length, 'archivos'))
precacheAndRoute(manifest)
cleanupOutdatedCaches()
registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html'), { denylist: NAVIGATION_DENYLIST }))

registerRoute(
  ({ url, request }) => isPublicApi(url, request.method),
  new StaleWhileRevalidate({
    cacheName: PUBLIC_API_CACHE.name,
    plugins: [
      new CacheableResponsePlugin({ statuses: [...PUBLIC_API_CACHE.statuses] }),
      new ExpirationPlugin({ maxEntries: PUBLIC_API_CACHE.maxEntries, maxAgeSeconds: PUBLIC_API_CACHE.maxAgeSeconds }),
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
  ({ request }) => isImage(request.destination),
  new CacheFirst({
    cacheName: IMAGES_CACHE.name,
    plugins: [new ExpirationPlugin({ maxEntries: IMAGES_CACHE.maxEntries, maxAgeSeconds: IMAGES_CACHE.maxAgeSeconds })],
  }),
)

async function notify(message: MessageToPage) {
  const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
  windows.forEach((w) => w.postMessage(message))
}

const subscriptionQueue = new Queue(SUBSCRIPTION_QUEUE.name, {
  maxRetentionTime: SUBSCRIPTION_QUEUE.maxRetentionMinutes,
  onSync: async ({ queue }) => {
    log('sync: reenviando la cola', SUBSCRIPTION_QUEUE.name)
    const sent = await replayQueue(queue, (request) => fetch(request), notify)
    log('sync: reenviados', sent)
  },
})

registerRoute(
  ({ url }) => isSubscription(url),
  async ({ request }) => {
    const response = await sendOrQueueSubscription(request, subscriptionQueue, (r) => fetch(r), notify)
    if (response.headers.get('X-Queued') === '1') {
      log('POST /api/v1/subscriptions sin red: guardado en IndexedDB (workbox-background-sync › requests)')
    }
    return response
  },
  'POST',
)

self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (isSkipWaiting(event.data)) void self.skipWaiting()
})