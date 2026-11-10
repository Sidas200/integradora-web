import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'
import { api } from '@/shared/api/client'
import { toApiError } from '@/shared/api/problems'
import type { components } from '@/shared/api/schema'

export type SaveSummary = components['schemas']['SaveSummary']
export type SaveDetail = components['schemas']['SaveDetail']
export type PlaySession = components['schemas']['PlaySession']

export const SESSIONS_PAGE_SIZE = 10

/**
 * Under 'account' like every private query, so logout removes them (AuthProvider).
 * README §7.5 names them ['saves'] and ['sessions', { slot }]; see §12.2.
 */
export const savesKeys = {
  list: ['account', 'saves'] as const,
  detail: (slot: number) => ['account', 'saves', slot] as const,
  sessions: (slot: number) => ['account', 'sessions', { slot }] as const,
}

/** GET /account/saves: the slots that have a save (3 at most; an empty slot is not in the list). */
export const savesQuery = () =>
  queryOptions({
    queryKey: savesKeys.list,
    queryFn: async () => {
      const { data, error, response } = await api.GET('/account/saves')
      if (error || !data) throw toApiError(error, response.status)
      return data
    },
  })

/** GET /account/saves/{slot}: stats, inventory and every milestone of the story. 404 if the slot is empty. */
export const saveDetailQuery = (slot: number) =>
  queryOptions({
    queryKey: savesKeys.detail(slot),
    queryFn: async () => {
      const { data, error, response } = await api.GET('/account/saves/{slot}', { params: { path: { slot } } })
      if (error || !data) throw toApiError(error, response.status)
      return data
    },
  })

/** GET /account/sessions?slot=: play sessions of one slot, newest first, with "Cargar más". */
export const slotSessionsInfiniteQuery = (slot: number, size: number = SESSIONS_PAGE_SIZE) =>
  infiniteQueryOptions({
    queryKey: savesKeys.sessions(slot),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const { data, error, response } = await api.GET('/account/sessions', {
        params: { query: { page: pageParam, size, slot } },
      })
      if (error || !data) throw toApiError(error, response.status)
      return data
    },
    getNextPageParam: (last) => (last.page.number + 1 < last.page.totalPages ? last.page.number + 1 : undefined),
  })