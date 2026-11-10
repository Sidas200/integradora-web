import type { RouteObject } from 'react-router'

/**
 * /lab: diagnostics screen of the PWA lab. Only in development: in `npm run build` the condition
 * becomes `false`, the dynamic import is dead code and Vite does not even emit the LabPage chunk.
 */
export const labRoutes: RouteObject[] = import.meta.env.DEV
  ? [{ path: 'lab', lazy: async () => ({ Component: (await import('./pages/LabPage')).LabPage }) }]
  : []