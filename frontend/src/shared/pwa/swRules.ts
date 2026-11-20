import type { MessageToPage } from './messages'

/**
 * The Service Worker's decisions (README §8.3), apart from sw.ts so they can be tested without a
 * real worker. sw.ts only wires them to Workbox. Uses nothing from window or self: the same file
 * compiles for the page (tests) and for the worker.
 */

/** Requests that never get the SPA shell: the API answers its own errors (404 problem+json, not index.html). */
export const NAVIGATION_DENYLIST = [/^\/api\//]

/** Public API answers kept for a day (Stale-While-Revalidate): news and the achievements catalog. */
export const PUBLIC_API_CACHE = { name: 'public-api', maxEntries: 50, maxAgeSeconds: 24 * 60 * 60, statuses: [200] } as const
/** Images (covers, icons): Cache First for 30 days. */
export const IMAGES_CACHE = { name: 'images', maxEntries: 120, maxAgeSeconds: 30 * 24 * 60 * 60 } as const
/** A launch-notice subscription made offline is retried for up to 24 h (minutes, as Workbox wants). */
export const SUBSCRIPTION_QUEUE = { name: 'subscription-queue', maxRetentionMinutes: 24 * 60 } as const

/**
 * Only public GETs. Anything under /account carries the player's data and an Authorization header:
 * it must never end up in Cache Storage, where another person on the same computer could read it.
 */
export function isPublicApi(url: URL, method: string): boolean {
  if (method !== 'GET') return false
  return url.pathname === '/api/v1/news' || url.pathname.startsWith('/api/v1/news/') || url.pathname === '/api/v1/achievements'
}

export const isImage = (destination: string) => destination === 'image'

export const isSubscription = (url: URL) => url.pathname === '/api/v1/subscriptions'

export const isSkipWaiting = (data: unknown) =>
  typeof data === 'object' && data !== null && (data as { type?: unknown }).type === 'SKIP_WAITING'

/** What the page receives when the subscription was queued: 202 with X-Queued, so the form can say so. */
export function queuedResponse(): Response {
  return new Response(null, { status: 202, headers: { 'X-Queued': '1' } })
}

export interface QueueEntry {
  request: Request
  timestamp?: number
}

/** The part of workbox-background-sync's Queue these rules use. */
export interface RequestQueue {
  pushRequest(entry: QueueEntry): Promise<void>
  shiftRequest(): Promise<QueueEntry | undefined>
  unshiftRequest(entry: QueueEntry): Promise<void>
}

export type Notify = (message: MessageToPage) => Promise<void>
type Fetch = (request: Request) => Promise<Response>

/**
 * POST /api/v1/subscriptions: with network it goes through untouched (the API's answer, 4xx included);
 * without network it is queued in IndexedDB and the page gets 202 X-Queued.
 */
export async function sendOrQueueSubscription(request: Request, queue: RequestQueue, fetcher: Fetch, notify: Notify): Promise<Response> {
  try {
    return await fetcher(request.clone())
  } catch {
    await queue.pushRequest({ request })
    await notify({ type: 'SUBSCRIPTION_QUEUED' })
    return queuedResponse()
  }
}

/**
 * Background Sync: sends the queue in order. If the network fails again, the entry goes back to the
 * front and the error is rethrown so the browser schedules another sync. Tells the pages how many were sent.
 */
export async function replayQueue(queue: RequestQueue, fetcher: Fetch, notify: Notify): Promise<number> {
  let sent = 0
  let entry: QueueEntry | undefined
  while ((entry = await queue.shiftRequest())) {
    try {
      await fetcher(entry.request.clone())
      sent++
    } catch (error) {
      await queue.unshiftRequest(entry)
      if (sent > 0) await notify({ type: 'SUBSCRIPTION_SENT', count: sent })
      throw error
    }
  }
  if (sent > 0) await notify({ type: 'SUBSCRIPTION_SENT', count: sent })
  return sent
}