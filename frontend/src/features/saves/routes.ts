import type { RouteObject } from 'react-router'

/** Child routes of /app. */
export const savesRoutes: RouteObject[] = [
  { path: 'saves', lazy: async () => ({ Component: (await import('./pages/SavesPage')).SavesPage }) },
  { path: 'saves/:slot', lazy: async () => ({ Component: (await import('./pages/SaveDetailPage')).SaveDetailPage }) },
]