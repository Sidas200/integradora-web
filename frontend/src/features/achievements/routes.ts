import type { RouteObject } from 'react-router'

/** Child routes of /app. */
export const achievementsRoutes: RouteObject[] = [
  { path: 'achievements', lazy: async () => ({ Component: (await import('./pages/AchievementsPage')).AchievementsPage }) },
]