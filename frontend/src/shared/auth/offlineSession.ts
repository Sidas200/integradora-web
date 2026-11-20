import type { components } from '@/shared/api/schema'

type SessionPlayer = components['schemas']['SessionPlayer']

/**
 * Who was signed in on this browser, without any token (README §8.5). It lets the app open in read-only
 * mode when the server cannot be reached, and tells the persisted cache which player it belongs to.
 * The refresh token stays in its HttpOnly cookie; this is only the id, name and email shown on screen.
 */
const KEY = 'tdimp.offline-session'

function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null // storage blocked (some private modes): there is simply no read-only mode
  }
}

export function readOfflineSession(): SessionPlayer | null {
  try {
    const raw = storage()?.getItem(KEY)
    if (!raw) return null
    const value: unknown = JSON.parse(raw)
    if (typeof value === 'object' && value !== null && 'id' in value && 'username' in value && 'email' in value) {
      const { id, username, email } = value as SessionPlayer
      if (typeof id === 'string' && typeof username === 'string' && typeof email === 'string') return { id, username, email }
    }
    return null
  } catch {
    return null
  }
}

export function saveOfflineSession(player: SessionPlayer): void {
  try {
    storage()?.setItem(KEY, JSON.stringify({ id: player.id, username: player.username, email: player.email }))
  } catch {
    // quota or blocked storage: the app keeps working online
  }
}

export function clearOfflineSession(): void {
  try {
    storage()?.removeItem(KEY)
  } catch {
    // nothing to clear
  }
}