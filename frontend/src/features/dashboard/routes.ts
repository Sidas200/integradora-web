import type { RouteObject } from 'react-router'

/** Child routes of /app. */
export const dashboardRoutes: RouteObject[] = [
  { index: true, lazy: async () => ({ Component: (await import('./pages/DashboardPage')).DashboardPage }) },
]