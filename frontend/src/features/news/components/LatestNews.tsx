import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { EmptyState, ErrorState, Skeleton } from '@/shared/ui/states'
import { latestNewsQuery } from '../queries'
import { NewsCard } from './NewsCard'

/** The newest posts for the landing, with a link to the full list. */
export function LatestNews({ size = 3 }: { size?: number }) {
  const { t } = useTranslation()
  const q = useQuery(latestNewsQuery(size))

  if (q.isPending) return <Skeleton rows={size} />
  if (q.isError) return <ErrorState error={q.error} onRetry={() => void q.refetch()} />
  if (q.data.length === 0) return <EmptyState title={t('news.empty.title')} text={t('news.empty.text')} />

  return (
    <div data-list="latest-news">
      <ul>
        {q.data.map((n) => (
          <li key={n.slug}>
            <NewsCard news={n} />
          </li>
        ))}
      </ul>
      <Link to="/news">{t('landing.news.seeAll')}</Link>
    </div>
  )
}