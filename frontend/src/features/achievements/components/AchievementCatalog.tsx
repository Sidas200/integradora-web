import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { EmptyState, ErrorState, Skeleton } from '@/shared/ui/states'
import { achievementsCatalogQuery } from '../queries'

/** Public list of achievements. `data-hidden` lets the design show hidden ones differently. */
export function AchievementCatalog() {
  const { t } = useTranslation()
  const q = useQuery(achievementsCatalogQuery())

  if (q.isPending) return <Skeleton rows={4} />
  if (q.isError) return <ErrorState error={q.error} onRetry={() => void q.refetch()} />
  if (q.data.length === 0) return <EmptyState title={t('achievements.empty')} />

  return (
    <ul data-list="achievements">
      {q.data.map((a) => (
        <li key={a.id} data-achievement-id={a.id} data-hidden={a.hidden} data-icon={a.iconKey ?? undefined}>
          <h3>{a.name}</h3>
          <p>{a.description ?? t('landing.achievements.hiddenHint')}</p>
        </li>
      ))}
    </ul>
  )
}