import type { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { useState, type ReactNode } from 'react'
import { AuthProvider, readOfflineSession } from '@/shared/auth'
import { createIdbPersister, PERSIST_MAX_AGE, shouldPersistQuery } from '@/shared/query/persister'
import { createQueryClient } from '@/shared/query/queryClient'
import '@/shared/i18n/i18n'

// The snapshot in IndexedDB belongs to whoever is saved as the session of this browser.
const persister = createIdbPersister(() => readOfflineSession()?.id ?? null)

/**
 * Global providers. The queries marked `persisted` are kept in IndexedDB so /app opens with data
 * without network (README §8.5). `buster` is the player saved when the app opened: a snapshot of
 * another player, or one with no session, is thrown away instead of restored.
 */
export function Providers({ children, client }: { children: ReactNode; client?: QueryClient }) {
  const [queryClient] = useState(() => client ?? createQueryClient())
  const [buster] = useState(() => readOfflineSession()?.id ?? 'anonymous')
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: PERSIST_MAX_AGE,
        buster,
        dehydrateOptions: { shouldDehydrateQuery: shouldPersistQuery },
      }}
    >
      <AuthProvider>{children}</AuthProvider>
    </PersistQueryClientProvider>
  )
}