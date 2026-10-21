import type { RouteObject } from 'react-router'

export const landingRoutes: RouteObject[] = [
  { index: true, lazy: async () => ({ Component: (await import('./pages/LandingPage')).LandingPage }) },
]