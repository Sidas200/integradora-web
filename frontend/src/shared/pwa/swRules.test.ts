import { describe, expect, it, vi } from 'vitest'
import type { MessageToPage } from './messages'
import {
  isImage, isPublicApi, isSkipWaiting, isSubscription, NAVIGATION_DENYLIST, PUBLIC_API_CACHE, queuedResponse,
  replayQueue, sendOrQueueSubscription, SUBSCRIPTION_QUEUE, type QueueEntry, type RequestQueue,
} from './swRules'

const at = (path: string) => new URL(path, 'https://tdimp.app')

/** A queue like workbox-background-sync's, kept in an array. */
function memoryQueue(initial: QueueEntry[] = []): RequestQueue & { entries: QueueEntry[] } {
  const entries = [...initial]
  return {
    entries,
    pushRequest: async (entry) => void entries.push(entry),
    shiftRequest: async () => entries.shift(),
    unshiftRequest: async (entry) => void entries.unshift(entry),
  }
}

const subscription = (email: string) =>
  new Request('https://tdimp.app/api/v1/subscriptions', { method: 'POST', body: JSON.stringify({ email }) })

describe('qué guarda el Service Worker en Cache Storage', () => {
  it.each([
    ['/api/v1/news', 'GET', true],
    ['/api/v1/news?page=1&size=20', 'GET', true],
    ['/api/v1/news/devlog-01', 'GET', true],
    ['/api/v1/achievements', 'GET', true],
    ['/api/v1/newsletter', 'GET', false],
    ['/api/v1/account', 'GET', false],
    ['/api/v1/account/achievements', 'GET', false],
    ['/api/v1/news', 'POST', false],
    ['/api/v1/auth/refresh', 'POST', false],
  ])('%s %s → %s', (path, method, cached) => {
    expect(isPublicApi(at(path), method)).toBe(cached)
  })

  it('solo guarda respuestas 200 y las expira en un día', () => {
    expect(PUBLIC_API_CACHE.statuses).toEqual([200])
    expect(PUBLIC_API_CACHE.maxAgeSeconds).toBe(86_400)
  })

  it('las imágenes van a su propia caché', () => {
    expect(isImage('image')).toBe(true)
    expect(isImage('script')).toBe(false)
    expect(isImage('')).toBe(false)
  })
})

describe('navegación', () => {
  it.each([
    ['/api/v1/news', true],
    ['/api/v1/account', true],
    ['/app/history', false],
    ['/news/devlog-01', false],
    ['/', false],
  ])('%s queda fuera del shell de la SPA: %s', (path, excluded) => {
    expect(NAVIGATION_DENYLIST.some((rule) => rule.test(path))).toBe(excluded)
  })
})

describe('aviso de lanzamiento sin conexión (Background Sync)', () => {
  it('solo intercepta POST /api/v1/subscriptions', () => {
    expect(isSubscription(at('/api/v1/subscriptions'))).toBe(true)
    expect(isSubscription(at('/api/v1/subscriptions/other'))).toBe(false)
    expect(SUBSCRIPTION_QUEUE.maxRetentionMinutes).toBe(1440)
  })

  it('con red pasa la respuesta de la API tal cual, también un 400', async () => {
    const queue = memoryQueue()
    const notify = vi.fn(async (_: MessageToPage) => {})
    const fetcher = vi.fn(async () => new Response('{"code":"VALIDATION_FAILED"}', { status: 400 }))

    const response = await sendOrQueueSubscription(subscription('a@example.com'), queue, fetcher, notify)

    expect(response.status).toBe(400)
    expect(queue.entries).toHaveLength(0)
    expect(notify).not.toHaveBeenCalled()
  })

  it('sin red la guarda en la cola, avisa a la página y responde 202 X-Queued', async () => {
    const queue = memoryQueue()
    const notify = vi.fn(async (_: MessageToPage) => {})
    const fetcher = vi.fn(async () => {
      throw new TypeError('Failed to fetch')
    })

    const response = await sendOrQueueSubscription(subscription('a@example.com'), queue, fetcher, notify)

    expect(response.status).toBe(202)
    expect(response.headers.get('X-Queued')).toBe('1')
    expect(queue.entries).toHaveLength(1)
    expect(await queue.entries[0].request.json()).toEqual({ email: 'a@example.com' })
    expect(notify).toHaveBeenCalledWith({ type: 'SUBSCRIPTION_QUEUED' })
  })

  it('al volver la red reenvía la cola en orden y dice cuántas se mandaron', async () => {
    const queue = memoryQueue([{ request: subscription('a@example.com') }, { request: subscription('b@example.com') }])
    const notify = vi.fn(async (_: MessageToPage) => {})
    const sentEmails: string[] = []
    const fetcher = vi.fn(async (request: Request) => {
      sentEmails.push(((await request.json()) as { email: string }).email)
      return new Response(null, { status: 202 })
    })

    expect(await replayQueue(queue, fetcher, notify)).toBe(2)
    expect(sentEmails).toEqual(['a@example.com', 'b@example.com'])
    expect(queue.entries).toHaveLength(0)
    expect(notify).toHaveBeenCalledWith({ type: 'SUBSCRIPTION_SENT', count: 2 })
  })

  it('si la red vuelve a fallar, la entrada regresa al frente y el error sigue para reintentar después', async () => {
    const queue = memoryQueue([{ request: subscription('a@example.com') }, { request: subscription('b@example.com') }])
    const notify = vi.fn(async (_: MessageToPage) => {})
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 202 }))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))

    await expect(replayQueue(queue, fetcher, notify)).rejects.toThrow('Failed to fetch')

    expect(queue.entries).toHaveLength(1)
    expect(await queue.entries[0].request.json()).toEqual({ email: 'b@example.com' })
    expect(notify).toHaveBeenCalledWith({ type: 'SUBSCRIPTION_SENT', count: 1 })
  })

  it('una cola vacía no avisa nada', async () => {
    const notify = vi.fn(async (_: MessageToPage) => {})
    expect(await replayQueue(memoryQueue(), vi.fn(), notify)).toBe(0)
    expect(notify).not.toHaveBeenCalled()
  })

  it('la respuesta de cola es 202 sin cuerpo', async () => {
    const response = queuedResponse()
    expect(response.status).toBe(202)
    expect(await response.text()).toBe('')
  })
})

describe('mensajes de la página', () => {
  it.each([
    [{ type: 'SKIP_WAITING' }, true],
    [{ type: 'OTHER' }, false],
    ['SKIP_WAITING', false],
    [null, false],
    [undefined, false],
  ])('%j activa la versión nueva: %s', (data, expected) => {
    expect(isSkipWaiting(data)).toBe(expected)
  })
})