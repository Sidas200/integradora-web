import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { createQueryClient } from '@/shared/query/queryClient'
import '@/shared/i18n/i18n'

/** Global providers. Phase 3 adds AuthProvider here; phase 8 the IndexedDB persistence. */
export function Providers({ children, client }: { children: ReactNode; client?: QueryClient }) {
  const [queryClient] = useState(() => client ?? createQueryClient())
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}