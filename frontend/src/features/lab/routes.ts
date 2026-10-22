import type { RouteObject } from 'react-router'

/** /lab: diagnostics screen of the PWA lab (used by scripts/lab-evidence.mjs). */
export const labRoutes: RouteObject[] = [
  { path: 'lab', lazy: async () => ({ Component: (await import('./pages/LabPage')).LabPage }) },
]