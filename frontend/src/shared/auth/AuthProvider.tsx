import { useQueryClient } from '@tanstack/react-query'
import { useEffect, type ReactNode } from 'react'
import { api } from '@/shared/api/client'
import { authMiddleware } from './authMiddleware'
import { getSession, restoreSession, subscribeSession } from './session'

// Registered once: every request of the app goes through the same openapi-fetch client.
api.use(authMiddleware)

/**
 * Restores the session when the app opens (refresh cookie) and, when the session ends,
 * removes from the cache everything that belonged to that player.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()

  useEffect(() => {
    void restoreSession()
  }, [])

  useEffect(() => {
    let previous = getSession().status
    return subscribeSession(() => {
      const current = getSession().status
      if (previous === 'authenticated' && current === 'anonymous') {
        queryClient.removeQueries({ queryKey: ['account'] })
      }
      previous = current
    })
  }, [queryClient])

  return children
}