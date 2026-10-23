import { queryOptions } from '@tanstack/react-query'
import { api } from '@/shared/api/client'
import { toApiError } from '@/shared/api/problems'
import type { components } from '@/shared/api/schema'

export type Account = components['schemas']['Account']

/** Every query of the player's private data starts with 'account': logout removes them all. */
export const accountKeys = {
  profile: ['account', 'profile'] as const,
}

/** GET /account: profile and summary. Needs the access token (authMiddleware adds it). */
export const accountQuery = () =>
  queryOptions({
    queryKey: accountKeys.profile,
    queryFn: async () => {
      const { data, error, response } = await api.GET('/account')
      if (error || !data) throw toApiError(error, response.status)
      return data
    },
  })