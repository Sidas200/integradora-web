import type { RouteObject } from 'react-router'

export const newsRoutes: RouteObject[] = [
  { path: 'news', lazy: async () => ({ Component: (await import('./pages/NewsPage')).NewsPage }) },
  { path: 'news/:slug', lazy: async () => ({ Component: (await import('./pages/NewsPostPage')).NewsPostPage }) },
]