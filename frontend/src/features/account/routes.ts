import type { RouteObject } from 'react-router'

/** Child routes of /app: /app/account, /app/account/settings, /security and /delete. */
export const accountRoutes: RouteObject[] = [
  {
    path: 'account',
    lazy: async () => ({ Component: (await import('./pages/AccountLayout')).AccountLayout }),
    children: [
      { index: true, lazy: async () => ({ Component: (await import('./pages/ProfilePage')).ProfilePage }) },
      { path: 'settings', lazy: async () => ({ Component: (await import('./pages/SettingsPage')).SettingsPage }) },
      { path: 'security', lazy: async () => ({ Component: (await import('./pages/SecurityPage')).SecurityPage }) },
      { path: 'delete', lazy: async () => ({ Component: (await import('./pages/DeleteAccountPage')).DeleteAccountPage }) },
    ],
  },
]