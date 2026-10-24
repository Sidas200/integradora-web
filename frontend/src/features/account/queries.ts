import { queryOptions } from '@tanstack/react-query'
import { api } from '@/shared/api/client'
import { toApiError } from '@/shared/api/problems'
import type { components } from '@/shared/api/schema'

export type Account = components['schemas']['Account']
export type Settings = components['schemas']['Settings']
export type Device = components['schemas']['Device']

/** Every query of the player's private data starts with 'account': logout removes them all (AuthProvider). */
export const accountKeys = {
  profile: ['account', 'profile'] as const,
  settings: ['account', 'settings'] as const,
  devices: ['account', 'devices'] as const,
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

/** GET /account/settings: the game's settings saved in the cloud. */
export const settingsQuery = () =>
  queryOptions({
    queryKey: accountKeys.settings,
    queryFn: async () => {
      const { data, error, response } = await api.GET('/account/settings')
      if (error || !data) throw toApiError(error, response.status)
      return data
    },
  })

/** GET /account/devices: one row per login that is still active (web, game, mobile app). */
export const devicesQuery = () =>
  queryOptions({
    queryKey: accountKeys.devices,
    queryFn: async () => {
      const { data, error, response } = await api.GET('/account/devices')
      if (error || !data) throw toApiError(error, response.status)
      return data
    },
  })