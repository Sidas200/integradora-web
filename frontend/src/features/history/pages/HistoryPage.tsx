import { useInfiniteQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui/Button'
import { PageHeader } from '@/shared/ui/PageHeader'
import { EmptyState, ErrorState, Skeleton } from '@/shared/ui/states'
import { Timeline } from '../components/Timeline'
import { TypeFilter } from '../components/TypeFilter'
import { historyInfiniteQuery } from '../queries'
import { useTypeFilter } from '../useTypeFilter'

/** README §7.5. The filter stays visible in every state so an empty filter can be changed. */
export function HistoryPage() {
  const { t } = useTranslation()
  const [type, setType] = useTypeFilter()
  const q = useInfiniteQuery(historyInfiniteQuery(type))

  const items = q.data?.pages.flatMap((p) => p.content) ?? []
  const total = q.data?.pages[0]?.page.totalElements ?? 0

  return (
    <section>
      <PageHeader title={t('pages.history')} />
      <TypeFilter value={type} onChange={setType} />

      {q.data === undefined && (q.isError
        ? <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        : <Skeleton rows={6} />)}
      {q.data && items.length === 0 && (type
        ? <EmptyState title={t('history.emptyFiltered.title')} text={t('history.emptyFiltered.text')} />
        : <EmptyState title={t('history.empty.title')} text={t('history.empty.text')} />)}
      {q.data && items.length > 0 && (
        <>
          <p aria-live="polite">{t('history.count', { shown: items.length, total })}</p>
          <Timeline items={items} />
          {q.hasNextPage && (
            <Button variant="outline" onClick={() => void q.fetchNextPage()} loading={q.isFetchingNextPage}>
              {t('common.loadMore')}
            </Button>
          )}
        </>
      )}
    </section>
  )
}