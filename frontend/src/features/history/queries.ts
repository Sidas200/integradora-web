import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'
import { api } from '@/shared/api/client'
import { toApiError } from '@/shared/api/problems'
import type { components } from '@/shared/api/schema'

export type HistoryItem = components['schemas']['HistoryItem']
export type HistoryType = HistoryItem['type']

export const HISTORY_TYPES: readonly HistoryType[] = ['SESSION', 'ACHIEVEMENT', 'MILESTONE']
export const HISTORY_PAGE_SIZE = 20

export function isHistoryType(value: string | null): value is HistoryType {
  return value !== null && (HISTORY_TYPES as readonly string[]).includes(value)
}

/** Under 'account' so logout removes them; README §7.5 names it ['history', { type }] (see §12.2). */
export const historyKeys = {
  list: (type?: HistoryType) => ['account', 'history', { type }] as const,
  recent: (size: number) => ['account', 'history', 'recent', size] as const,
}

/** GET /account/history: sessions, achievements and milestones in one timeline, newest first. */
export const historyInfiniteQuery = (type?: HistoryType, size: number = HISTORY_PAGE_SIZE) =>
  infiniteQueryOptions({
    queryKey: historyKeys.list(type),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const { data, error, response } = await api.GET('/account/history', {
        params: { query: { page: pageParam, size, type } },
      })
      if (error || !data) throw toApiError(error, response.status)
      return data
    },
    getNextPageParam: (last) => (last.page.number + 1 < last.page.totalPages ? last.page.number + 1 : undefined),
  })

/** The last few entries for the dashboard (GET /account/history?size=5). */
export const recentHistoryQuery = (size = 5) =>
  queryOptions({
    queryKey: historyKeys.recent(size),
    queryFn: async () => {
      const { data, error, response } = await api.GET('/account/history', { params: { query: { page: 0, size } } })
      if (error || !data) throw toApiError(error, response.status)
      return data.content
    },
  })