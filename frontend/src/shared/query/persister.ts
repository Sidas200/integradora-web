import type { Query } from '@tanstack/react-query'
import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client'
import { createStore, del, get, set } from 'idb-keyval'

/** How long the saved player data can be shown without network (README §8.5). */
export const PERSIST_MAX_AGE = 7 * 24 * 60 * 60 * 1000

/**
 * Spread into the queryOptions of every list that must be readable offline. gcTime has to be at
 * least maxAge: a query removed from memory is also removed from the next snapshot in IndexedDB.
 */
export const persisted = { meta: { persist: true }, gcTime: PERSIST_MAX_AGE } as const

export const shouldPersistQuery = (query: Query) => query.meta?.persist === true && query.state.status === 'success'

const KEY = 'query-cache'
// The database opens on the first read or write, never at import time.
const store = createStore('tdimp', 'query-cache')
const available = () => typeof indexedDB !== 'undefined'

/**
 * TanStack Query persister on IndexedDB (idb-keyval). Every snapshot is stamped with its owner
 * (the player's id) as `buster`: a snapshot of another player, or one written without a session,
 * is discarded when the app opens. A snapshot with nothing to keep deletes the entry instead,
 * so after logout IndexedDB is left empty.
 */
export function createIdbPersister(owner: () => string | null): Persister {
  return {
    async persistClient(client: PersistedClient) {
      if (!available()) return
      const id = owner()
      if (!id || client.clientState.queries.length === 0) return del(KEY, store)
      await set(KEY, { ...client, buster: id }, store)
    },
    async restoreClient() {
      return available() ? get<PersistedClient>(KEY, store) : undefined
    },
    async removeClient() {
      if (available()) await del(KEY, store)
    },
  }
}

/** Logout, account deletion or a session the API no longer accepts: nothing of that player stays on disk. */
export async function clearPersistedQueries(): Promise<void> {
  if (available()) await del(KEY, store)
}