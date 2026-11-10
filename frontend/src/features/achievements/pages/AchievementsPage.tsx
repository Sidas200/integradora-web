import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { formatLongDate } from '@/shared/ui/formatDate'
import { PageHeader } from '@/shared/ui/PageHeader'
import { EmptyState, ErrorState, Skeleton } from '@/shared/ui/states'
import { myAchievementsQuery } from '../queries'

/**
 * Every achievement of the game with the player's status. A hidden one that is still locked
 * arrives masked from the API (name "Logro oculto", no description) and the page keeps it that way.
 */
export function AchievementsPage() {
  const { t } = useTranslation()
  const q = useQuery(myAchievementsQuery())

  const unlocked = q.data?.filter((a) => a.unlocked).length ?? 0
  const total = q.data?.length ?? 0

  return (
    <section>
      <PageHeader title={t('pages.achievements')} />

      {q.isPending && <Skeleton rows={6} />}
      {q.isError && <ErrorState error={q.error} onRetry={() => void q.refetch()} />}
      {q.isSuccess && total === 0 && <EmptyState title={t('achievements.empty')} />}
      {q.isSuccess && total > 0 && (
        <>
          <p id="achievements-progress">{t('achievements.progress', { unlocked, total })}</p>
          <progress value={unlocked} max={total} aria-labelledby="achievements-progress" />
          <ul data-list="my-achievements">
            {q.data.map((a) => (
              <li
                key={a.id}
                data-achievement-id={a.id}
                data-unlocked={a.unlocked}
                data-hidden={a.hidden}
                data-icon={a.iconKey ?? undefined}
                data-testid="achievement-item"
              >
                <h2>{a.name}</h2>
                <p>{a.description ?? t('landing.achievements.hiddenHint')}</p>
                <p>
                  {a.unlocked && a.unlockedAt
                    ? <time dateTime={a.unlockedAt}>{t('achievements.unlockedOn', { date: formatLongDate(a.unlockedAt) })}</time>
                    : t('achievements.locked')}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}