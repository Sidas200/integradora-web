import type { RouteObject } from 'react-router'
import { accountRoutes } from '@/features/account'
import { achievementsRoutes } from '@/features/achievements'
import { authRoutes } from '@/features/auth'
import { dashboardRoutes } from '@/features/dashboard'
import { historyRoutes } from '@/features/history'
import { labRoutes } from '@/features/lab'
import { landingRoutes } from '@/features/landing'
import { newsRoutes } from '@/features/news'
import { savesRoutes } from '@/features/saves'
import { RequireAuth } from '@/shared/auth'
import { AppLayout } from './layouts/AppLayout'
import { PublicLayout } from './layouts/PublicLayout'
import { NotFoundPage } from './pages/NotFoundPage'
import { RouteErrorPage } from './pages/RouteErrorPage'

export interface RouteOptions {
  /** Mounts /lab, the diagnostics screen of the PWA lab. Never in a production build. */
  lab: boolean
}

/**
 * Route tree (README §9.4). Each module contributes its routes through its index.ts;
 * this file only decides where they hang. Exported apart from the router for the tests.
 */
export function createRoutes({ lab }: RouteOptions): RouteObject[] {
  return [
    {
      element: <PublicLayout />,
      errorElement: <RouteErrorPage />,
      children: [
        ...landingRoutes,
        ...newsRoutes,
        ...authRoutes,
        ...(lab ? labRoutes : []),
        {
          path: 'app',
          element: (
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          ),
          children: [...dashboardRoutes, ...savesRoutes, ...historyRoutes, ...achievementsRoutes, ...accountRoutes],
        },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ]
}

/** Vite replaces import.meta.env.DEV with false in `npm run build`, so /lab only exists in `npm run dev`. */
export const routes = createRoutes({ lab: import.meta.env.DEV })