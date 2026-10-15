import { useInfiniteQuery } from '@tanstack/react-query'
import { api } from '../../shared/api/client'

export const NEWS_PAGE_SIZE = 6

export function useNewsList() {
  return useInfiniteQuery({
    queryKey: ['news'],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await api.GET('/news', { params: { query: { page: pageParam, size: NEWS_PAGE_SIZE } } })
      if (error || !data) throw new Error(error ? `${error.code}` : 'Empty response')
      return data
    },
    getNextPageParam: (last) => (last.page.number + 1 < last.page.totalPages ? last.page.number + 1 : undefined),
  })
}
