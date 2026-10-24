import { useSyncExternalStore } from 'react'
import { api } from '@/shared/api/client'
import { toApiError } from '@/shared/api/problems'
import type { components } from '@/shared/api/schema'
import { log } from '@/shared/lab/logger'

export type SessionPlayer = components['schemas']['SessionPlayer']
type TokenResponse = components['schemas']['TokenResponse']
type LoginRequest = components['schemas']['LoginRequest']
type RegisterRequest = components['schemas']['RegisterRequest']
type Account = components['schemas']['Account']

/** loading: restoring the session from the refresh cookie when the app opens. */
export type SessionStatus = 'loading' | 'authenticated' | 'anonymous'

export interface Session {
  status: SessionStatus
  player: SessionPlayer | null
}

/** CSRF defense of the refresh cookie: the API only reads tdimp_rt when this header comes along. */
export const CSRF_HEADERS = { 'X-Requested-With': 'tdimp-pwa' } as const

/** Renew a little before expiry so a request never leaves with a token about to die. */
const EXPIRY_MARGIN_MS = 30_000

// ------------------------------------------------------------------ state
// The access token lives only in memory (never localStorage): an XSS cannot read it after a reload,
// and the refresh token is an HttpOnly cookie JavaScript never sees.

let session: Session = { status: 'loading', player: null }
let accessToken: string | null = null
let accessExpiresAt = 0
let refreshing: Promise<boolean> | null = null
let endAfterLeavingApp = false
const listeners = new Set<() => void>()

function setSession(next: Session) {
  if (next.status === session.status && next.player?.id === session.player?.id
    && next.player?.username === session.player?.username) return
  session = next
  log('pwa', `Sesión: ${next.status}${next.player ? ` (${next.player.username})` : ''}`)
  listeners.forEach((listener) => listener())
}

function accept(tokens: TokenResponse) {
  accessToken = tokens.accessToken
  accessExpiresAt = Date.now() + tokens.expiresInSec * 1000
  setSession({ status: 'authenticated', player: tokens.player })
}

function forget() {
  accessToken = null
  accessExpiresAt = 0
  setSession({ status: 'anonymous', player: null })
}

// ------------------------------------------------------------------ reading

export function useSession(): Session {
  return useSyncExternalStore(subscribeSession, getSession)
}

export const getSession = (): Session => session

export function subscribeSession(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** A valid access token, renewing it first if it is missing or about to expire. null = no session. */
export async function getAccessToken(): Promise<string | null> {
  if (accessToken && Date.now() < accessExpiresAt - EXPIRY_MARGIN_MS) return accessToken
  if (session.status === 'anonymous') return null
  return (await refreshSession()) ? accessToken : null
}

// ------------------------------------------------------------------ actions

/**
 * Rotates the refresh cookie and gets a new access token. Several requests that need it at the
 * same time share ONE call: two parallel refreshes would present the same token twice and the API
 * would revoke the whole session as reuse (possible theft).
 */
export function refreshSession(): Promise<boolean> {
  refreshing ??= (async () => {
    try {
      const { data, response } = await acrossTabs(() =>
        api.POST('/auth/refresh', { headers: CSRF_HEADERS, body: {} }))
      if (data) {
        accept(data)
        return true
      }
      log('pwa', `Refresh rechazado (${response.status}): no hay sesión`)
      forget()
      return false
    } catch (error) {
      // Without network nobody can say whether the session is still valid; it is treated as closed.
      log('error', 'Refresh sin respuesta del servidor', error)
      forget()
      return false
    } finally {
      refreshing = null
    }
  })()
  return refreshing
}

/**
 * Two tabs opened at the same time would send the same cookie in parallel. Web Locks makes them take
 * turns: the second one goes out after the first one's response has already saved the new cookie.
 */
async function acrossTabs<T>(task: () => Promise<T>): Promise<T> {
  const locks = globalThis.navigator?.locks
  if (!locks) return task()
  let result!: T
  await locks.request('tdimp-auth-refresh', async () => {
    result = await task()
  })
  return result
}

/** Called once when the app opens: if the browser still has the refresh cookie, the session is back. */
export function restoreSession(): Promise<boolean> {
  if (!refreshing) {
    accessToken = null
    accessExpiresAt = 0
    setSession({ status: 'loading', player: null })
  }
  return refreshSession()
}

export async function login(body: Omit<LoginRequest, 'client'>): Promise<SessionPlayer> {
  const { data, error, response } = await api.POST('/auth/login', { body: { ...body, client: 'WEB' } })
  if (!data) throw toApiError(error, response.status)
  accept(data)
  return data.player
}

export async function register(body: Omit<RegisterRequest, 'client'>): Promise<SessionPlayer> {
  const { data, error, response } = await api.POST('/auth/register', { body: { ...body, client: 'WEB' } })
  if (!data) throw toApiError(error, response.status)
  accept(data)
  return data.player
}

/**
 * Revokes the session in the API and clears the cookie, but keeps the local session until endSession():
 * the screen can leave the private pages first, so RequireAuth does not bounce to /login.
 */
export async function revokeSession(): Promise<void> {
  try {
    await api.POST('/auth/logout', { headers: CSRF_HEADERS, body: {} })
  } catch (error) {
    log('error', 'Logout sin respuesta del servidor; la sesión se cierra solo en este navegador', error)
  }
}

/** Revokes in the API and closes the local session at once. The local session closes even without network. */
export async function logout(): Promise<void> {
  await revokeSession()
  forget()
}

/** Closes the local session: after revokeSession(), or when the API rejects the token even after renewing it. */
export function endSession(): void {
  forget()
}

/**
 * Confirms the password before a sensitive action (deleting the account). The API answers a new access
 * token with auth_time = now; the refresh cookie does not change. Throws ApiError INVALID_CREDENTIALS.
 */
export async function reauthenticate(password: string): Promise<void> {
  const { data, error, response } = await api.POST('/auth/reauthenticate', { body: { password } })
  if (!data) throw toApiError(error, response.status)
  accept(data)
}

/** The username changed in /account: the header and the greeting show the new one at once. */
export function updateSessionPlayer(account: Pick<Account, 'id' | 'username' | 'email'>): void {
  if (session.status !== 'authenticated' || session.player?.id !== account.id) return
  setSession({ status: 'authenticated', player: { id: account.id, username: account.username, email: account.email } })
}

/**
 * Logout and account deletion leave /app first and close the local session afterwards; closing it
 * while a private page is still on screen would make RequireAuth bounce to /login.
 * The layout calls takeScheduledEnd() after each navigation.
 */
export function scheduleEndSession(): void {
  endAfterLeavingApp = true
}

export function takeScheduledEnd(): boolean {
  const pending = endAfterLeavingApp
  endAfterLeavingApp = false
  return pending
}