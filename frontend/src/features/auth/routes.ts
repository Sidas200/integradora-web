import type { RouteObject } from 'react-router'

export const authRoutes: RouteObject[] = [
  { path: 'login', lazy: async () => ({ Component: (await import('./pages/LoginPage')).LoginPage }) },
  { path: 'register', lazy: async () => ({ Component: (await import('./pages/RegisterPage')).RegisterPage }) },
]