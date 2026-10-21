import { queryOptions } from '@tanstack/react-query'
import { api } from '@/shared/api/client'
import { toApiError } from '@/shared/api/problems'
import type { components } from '@/shared/api/schema'

export type Achievement = components['schemas']['Achievement']

export const achievementsKeys = {
  catalog: ['achievements', 'catalog'] as const,
}

/**
 * Public catalog (GET /achievements). Hidden ones arrive masked by the API.
 * It changes only with a migration, so it stays fresh for an hour like its Cache-Control.
 */
export const achievementsCatalogQuery = () =>
  queryOptions({
    queryKey: achievementsKeys.catalog,
    queryFn: async () => {
      const { data, error, response } = await api.GET('/achievements')
      if (error || !data) throw toApiError(error, response.status)
      return data
    },
    staleTime: 60 * 60 * 1000,
  })