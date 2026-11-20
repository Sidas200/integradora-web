import { queryOptions } from '@tanstack/react-query'
import { api } from '@/shared/api/client'
import { toApiError } from '@/shared/api/problems'
import type { components } from '@/shared/api/schema'
import { persisted } from '@/shared/query/persister'

export type Achievement = components['schemas']['Achievement']
export type PlayerAchievement = components['schemas']['PlayerAchievement']

/**
 * The public catalog and the player's status live under different roots: logout removes
 * everything under 'account' (AuthProvider) and the public catalog stays in the cache.
 */
export const achievementsKeys = {
  catalog: ['achievements', 'catalog'] as const,
  mine: ['account', 'achievements'] as const,
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

/** GET /account/achievements: the full catalog with unlocked/unlockedAt of this player. Readable offline. */
export const myAchievementsQuery = () =>
  queryOptions({
    ...persisted,
    queryKey: achievementsKeys.mine,
    queryFn: async () => {
      const { data, error, response } = await api.GET('/account/achievements')
      if (error || !data) throw toApiError(error, response.status)
      return data
    },
  })