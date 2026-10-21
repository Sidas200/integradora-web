import type { RouteObject } from 'react-router'

/** Child routes of /app. */
export const historyRoutes: RouteObject[] = [
  { path: 'history', lazy: async () => ({ Component: (await import('./pages/HistoryPage')).HistoryPage }) },
]