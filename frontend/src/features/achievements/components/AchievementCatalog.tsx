import { useQuery } from '@tanstack/react-query'
import { HelpCircle, Trophy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { EmptyState, ErrorState, Skeleton } from '@/shared/ui/states'
import { achievementsCatalogQuery } from '../queries'
import css from '../achievements.module.css'

/** Public list of achievements as framed cards (Kamui). `data-hidden` shows hidden ones as a mystery. */
export function AchievementCatalog() {
  const { t } = useTranslation()
  const q = useQuery(achievementsCatalogQuery())

  if (q.isPending) return <Skeleton rows={4} />
  if (q.isError) return <ErrorState error={q.error} onRetry={() => void q.refetch()} />
  if (q.data.length === 0) return <EmptyState title={t('achievements.empty')} />

  return (
    <ul data-list="achievements" className={css.grid}>
      {q.data.map((a) => (
        <li key={a.id} data-achievement-id={a.id} data-hidden={a.hidden} data-icon={a.iconKey ?? undefined} className={css.frame}>
          <span className={css.emblem} aria-hidden="true">{a.hidden ? <HelpCircle size={26} /> : <Trophy size={26} />}</span>
          <h3>{a.name}</h3>
          <p>{a.description ?? t('landing.achievements.hiddenHint')}</p>
        </li>
      ))}
    </ul>
  )
}
