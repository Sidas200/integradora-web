import type { PersistedClient } from '@tanstack/react-query-persist-client'
import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { clearPersistedQueries, createIdbPersister, persisted, PERSIST_MAX_AGE, shouldPersistQuery } from './persister'

const snapshot = (queries: number): PersistedClient => ({
  timestamp: Date.now(),
  buster: '',
  clientState: {
    mutations: [],
    queries: Array.from({ length: queries }, (_, i) => ({
      queryKey: ['account', i],
      queryHash: `["account",${i}]`,
      dehydratedAt: Date.now(),
      state: { data: i, dataUpdateCount: 1, dataUpdatedAt: 0, error: null, errorUpdateCount: 0, errorUpdatedAt: 0,
        fetchFailureCount: 0, fetchFailureReason: null, fetchMeta: null, isInvalidated: false, status: 'success', fetchStatus: 'idle' },
    })),
  },
})

describe('persister en IndexedDB', () => {
  it('marca cada copia con el jugador dueño', async () => {
    const persister = createIdbPersister(() => 'player-1')
    await persister.persistClient(snapshot(2))

    const restored = await persister.restoreClient()
    expect(restored?.buster).toBe('player-1')
    expect(restored?.clientState.queries).toHaveLength(2)
  })

  it('sin sesión no guarda nada y borra lo que hubiera', async () => {
    await createIdbPersister(() => 'player-1').persistClient(snapshot(1))
    await createIdbPersister(() => null).persistClient(snapshot(1))

    expect(await createIdbPersister(() => null).restoreClient()).toBeUndefined()
  })

  it('una copia sin consultas deja IndexedDB vacío', async () => {
    const persister = createIdbPersister(() => 'player-1')
    await persister.persistClient(snapshot(1))
    await persister.persistClient(snapshot(0))

    expect(await persister.restoreClient()).toBeUndefined()
  })

  it('removeClient y clearPersistedQueries borran la copia', async () => {
    const persister = createIdbPersister(() => 'player-1')
    await persister.persistClient(snapshot(1))
    await persister.removeClient()
    expect(await persister.restoreClient()).toBeUndefined()

    await persister.persistClient(snapshot(1))
    await clearPersistedQueries()
    expect(await persister.restoreClient()).toBeUndefined()
  })
})

describe('qué consultas se guardan', () => {
  it('solo las marcadas con persisted y con datos', async () => {
    const client = new QueryClient()
    await client.prefetchQuery({ queryKey: ['account', 'saves'], queryFn: () => [], ...persisted })
    await client.prefetchQuery({ queryKey: ['news'], queryFn: () => [] })
    await client.prefetchQuery({ queryKey: ['account', 'broken'], queryFn: () => Promise.reject(new Error('x')), ...persisted })

    const kept = client.getQueryCache().getAll().filter(shouldPersistQuery).map((q) => q.queryKey)
    expect(kept).toEqual([['account', 'saves']])
  })

  it('las marcadas viven en memoria al menos lo mismo que en IndexedDB', () => {
    expect(persisted.gcTime).toBeGreaterThanOrEqual(PERSIST_MAX_AGE)
  })
})