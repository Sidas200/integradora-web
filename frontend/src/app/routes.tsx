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

/**
 * Route tree (README §9.4). Each module contributes its routes through its index.ts;
 * this file only decides where they hang. Exported apart from the router for the tests.
 */
export const routes: RouteObject[] = [
  {
    element: <PublicLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      ...landingRoutes,
      ...newsRoutes,
      ...authRoutes,
      ...labRoutes,
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