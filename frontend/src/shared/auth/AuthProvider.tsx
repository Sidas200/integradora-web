import { useQueryClient } from '@tanstack/react-query'
import { useEffect, type ReactNode } from 'react'
import { api } from '@/shared/api/client'
import { clearPersistedQueries } from '@/shared/query/persister'
import { authMiddleware } from './authMiddleware'
import { readOfflineSession } from './offlineSession'
import { getSession, refreshSession, restoreSession, subscribeSession } from './session'

// Registered once: every request of the app goes through the same openapi-fetch client.
api.use(authMiddleware)

/**
 * Restores the session when the app opens (refresh cookie), leaves read-only mode when the network
 * comes back and, when the session ends, removes everything that belonged to that player: the query
 * cache in memory and its copy in IndexedDB (README §8.5).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()

  useEffect(() => {
    void restoreSession()
  }, [])

  useEffect(() => {
    let previous = getSession()
    let owner = readOfflineSession()?.id ?? null
    return subscribeSession(() => {
      const current = getSession()
      if (current.status === 'anonymous' && previous.status !== 'anonymous') {
        queryClient.removeQueries({ queryKey: ['account'] })
        void clearPersistedQueries()
        owner = null
      }
      if (current.player) {
        // Another player on the same browser never sees the data of the previous one.
        if (owner && owner !== current.player.id) queryClient.removeQueries({ queryKey: ['account'] })
        owner = current.player.id
      }
      if (previous.status === 'offline' && current.status === 'authenticated') {
        void queryClient.invalidateQueries({ queryKey: ['account'] })
      }
      previous = current
    })
  }, [queryClient])

  // Read-only mode ends by itself: with the network back the session is renewed and the data refreshed.
  useEffect(() => {
    const reconnect = () => {
      if (getSession().status === 'offline') void refreshSession()
    }
    window.addEventListener('online', reconnect)
    return () => window.removeEventListener('online', reconnect)
  }, [])

  return children
}