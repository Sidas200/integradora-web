import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'
import { api } from '@/shared/api/client'
import { toApiError } from '@/shared/api/problems'
import type { components } from '@/shared/api/schema'

export type NewsSummary = components['schemas']['NewsSummary']
export type NewsPost = components['schemas']['NewsPost']

export const NEWS_PAGE_SIZE = 6

/** Query keys of the module: every cache entry about news starts with 'news'. */
export const newsKeys = {
  all: ['news'] as const,
  list: (size: number) => ['news', 'list', size] as const,
  latest: (size: number) => ['news', 'latest', size] as const,
  post: (slug: string) => ['news', 'post', slug] as const,
}

/** Paginated list with "Cargar más" (GET /news?page=&size=). */
export const newsListInfiniteQuery = (size: number = NEWS_PAGE_SIZE) =>
  infiniteQueryOptions({
    queryKey: newsKeys.list(size),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const { data, error, response } = await api.GET('/news', { params: { query: { page: pageParam, size } } })
      if (error || !data) throw toApiError(error, response.status)
      return data
    },
    getNextPageParam: (last) => (last.page.number + 1 < last.page.totalPages ? last.page.number + 1 : undefined),
  })

/** First page only, for the landing (GET /news?size=3). */
export const latestNewsQuery = (size = 3) =>
  queryOptions({
    queryKey: newsKeys.latest(size),
    queryFn: async () => {
      const { data, error, response } = await api.GET('/news', { params: { query: { page: 0, size } } })
      if (error || !data) throw toApiError(error, response.status)
      return data.content
    },
  })

/** One post with its Markdown content (GET /news/{slug}). */
export const newsPostQuery = (slug: string) =>
  queryOptions({
    queryKey: newsKeys.post(slug),
    queryFn: async () => {
      const { data, error, response } = await api.GET('/news/{slug}', { params: { path: { slug } } })
      if (error || !data) throw toApiError(error, response.status)
      return data
    },
  })