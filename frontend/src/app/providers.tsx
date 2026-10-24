import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { AuthProvider } from '@/shared/auth'
import { createQueryClient } from '@/shared/query/queryClient'
import '@/shared/i18n/i18n'

/** Global providers. Phase 8 adds the IndexedDB persistence of the query cache here. */
export function Providers({ children, client }: { children: ReactNode; client?: QueryClient }) {
  const [queryClient] = useState(() => client ?? createQueryClient())
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  )
}