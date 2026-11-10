import { QueryClient } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router'
import { Providers } from '@/app/providers'
import { routes as appRoutes } from '@/app/routes'

/**
 * Renders a route tree starting at `path`, with a fresh query cache.
 * By default the real tree of the app; pass `createRoutes({...})` to test another configuration.
 */
export function renderRoute(path: string, routes: RouteObject[] = appRoutes) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <Providers client={client}>
      <RouterProvider router={router} />
    </Providers>,
  )
  return { router }
}