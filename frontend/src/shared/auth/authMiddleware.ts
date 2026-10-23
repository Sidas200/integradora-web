import type { Middleware } from 'openapi-fetch'
import { endSession, getAccessToken, refreshSession } from './session'

/** The only private routes of the API (BearerAuthInterceptor in the backend). */
const PRIVATE = /^\/api\/v1\/account(\/|$)/
/** 401 codes that a new access token can fix. INVALID_CREDENTIALS cannot. */
const RENEWABLE = new Set(['TOKEN_EXPIRED', 'INVALID_SESSION'])

/** Copy of each private request, to send it again after renewing the token (its body can be read only once). */
const pending = new WeakMap<Request, Request>()

const isPrivate = (request: Request) => PRIVATE.test(new URL(request.url).pathname)

async function codeOf(response: Response): Promise<string | undefined> {
  const body: unknown = await response.clone().json().catch(() => null)
  return typeof body === 'object' && body !== null && 'code' in body ? String(body.code) : undefined
}

/**
 * Adds `Authorization: Bearer` to /account requests. If the API answers 401 TOKEN_EXPIRED or
 * INVALID_SESSION, it renews the token once (shared refresh) and repeats the request; if that is
 * not possible the session ends and RequireAuth sends the player to /login.
 */
export const authMiddleware: Middleware = {
  async onRequest({ request }) {
    if (!isPrivate(request)) return undefined
    const token = await getAccessToken()
    if (token) request.headers.set('Authorization', `Bearer ${token}`)
    pending.set(request, request.clone())
    return request
  },

  async onResponse({ request, response }) {
    if (response.status !== 401 || !isPrivate(request)) return undefined
    const copy = pending.get(request)
    pending.delete(request)
    if (!copy || !RENEWABLE.has((await codeOf(response)) ?? '')) return undefined

    if (!(await refreshSession())) return undefined
    const token = await getAccessToken()
    if (!token) return undefined
    copy.headers.set('Authorization', `Bearer ${token}`)
    const retried = await globalThis.fetch(copy)
    if (retried.status === 401) endSession()
    return retried
  },
}