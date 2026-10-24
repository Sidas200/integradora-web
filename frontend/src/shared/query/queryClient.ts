import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/shared/api/problems'

/** Never retry what will not change by retrying: 4xx answers. */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status !== null && error.status < 500) return false
  return failureCount < 1
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        networkMode: 'offlineFirst',
        staleTime: 60_000,
        retry: shouldRetry,
        refetchOnReconnect: true,
        refetchOnWindowFocus: true,
      },
      mutations: { retry: false },
    },
  })
}