import { useInfiniteQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { log } from '@/shared/lab/logger'
import { Button } from '@/shared/ui/Button'
import { EmptyState, ErrorState, Skeleton } from '@/shared/ui/states'
import { newsListInfiniteQuery } from '../queries'
import { NewsCard } from './NewsCard'

/** Full paginated list with the four states (README §7.5). */
export function NewsList() {
  const { t } = useTranslation()
  const q = useInfiniteQuery(newsListInfiniteQuery())

  const items = q.data?.pages.flatMap((p) => p.content) ?? []
  const total = q.data?.pages[0]?.page.totalElements ?? 0

  useEffect(() => {
    if (q.status === 'success') log('render', `NewsList renderizó ${items.length} de ${total} noticias`)
  }, [q.status, items.length, total])

  if (q.isPending) return <Skeleton rows={3} />
  if (q.isError) return <ErrorState error={q.error} onRetry={() => void q.refetch()} />
  if (items.length === 0) return <EmptyState title={t('news.empty.title')} text={t('news.empty.text')} />

  return (
    <div data-list="news">
      <p aria-live="polite">{t('news.count', { shown: items.length, total })}</p>
      <ul>
        {items.map((n) => (
          <li key={n.slug} data-testid="news-item">
            <NewsCard news={n} />
          </li>
        ))}
      </ul>
      {q.hasNextPage && (
        <Button variant="outline" onClick={() => void q.fetchNextPage()} loading={q.isFetchingNextPage}>
          {t('common.loadMore')}
        </Button>
      )}
    </div>
  )
}