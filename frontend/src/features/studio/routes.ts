import type { RouteObject } from 'react-router'

/** Company pages: about the studio and the legal documents. */
export const studioRoutes: RouteObject[] = [
  { path: 'nosotros', lazy: async () => ({ Component: (await import('./pages/AboutPage')).AboutPage }) },
  { path: 'privacidad', lazy: async () => ({ Component: (await import('./pages/LegalPage')).PrivacyPage }) },
  { path: 'cookies', lazy: async () => ({ Component: (await import('./pages/LegalPage')).CookiesPage }) },
]
