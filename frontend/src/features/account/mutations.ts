import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api/client'
import { toApiError } from '@/shared/api/problems'
import { reauthenticate, updateSessionPlayer } from '@/shared/auth'
import { accountKeys, type Settings } from './queries'

/** PATCH /account: new username. The header and the greeting change at once. */
export function useRename() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (username: string) => {
      const { data, error, response } = await api.PATCH('/account', { body: { username } })
      if (!data) throw toApiError(error, response.status)
      return data
    },
    onSuccess: (account) => {
      queryClient.setQueryData(accountKeys.profile, account)
      updateSessionPlayer(account)
    },
  })
}

/** PUT /account/password. The API closes every other session, so the device list changes too. */
export function useChangePassword() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: { currentPassword: string; newPassword: string }) => {
      const { error, response } = await api.PUT('/account/password', { body })
      if (!response.ok) throw toApiError(error, response.status)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountKeys.devices }),
  })
}

/** PUT /account/settings replaces the whole object (controls included, which only the game edits). */
export function useSaveSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (settings: Settings) => {
      const { data, error, response } = await api.PUT('/account/settings', { body: settings })
      if (!data) throw toApiError(error, response.status)
      return data
    },
    onSuccess: (saved) => queryClient.setQueryData(accountKeys.settings, saved),
  })
}

/** DELETE /account/devices/{id}, or every device but this one when id is omitted. */
export function useRevokeDevices() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id?: string) => {
      const { error, response } = id
        ? await api.DELETE('/account/devices/{id}', { params: { path: { id } } })
        : await api.DELETE('/account/devices')
      if (!response.ok) throw toApiError(error, response.status)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: accountKeys.devices }),
  })
}

/**
 * Confirms the password (POST /auth/reauthenticate gives a token with auth_time = now) and then
 * DELETE /account, which the API only accepts from the web and within 5 minutes of that confirmation.
 */
export function useDeleteAccount() {
  return useMutation({
    mutationFn: async (password: string) => {
      await reauthenticate(password)
      const { error, response } = await api.DELETE('/account')
      if (!response.ok) throw toApiError(error, response.status)
    },
  })
}