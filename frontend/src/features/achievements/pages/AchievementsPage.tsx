import { useQuery } from '@tanstack/react-query'
import { HelpCircle, Lock, Trophy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatLongDate } from '@/shared/ui/formatDate'
import { PageHeader } from '@/shared/ui/PageHeader'
import { EmptyState, ErrorState, Skeleton } from '@/shared/ui/states'
import { myAchievementsQuery } from '../queries'
import css from '../achievements.module.css'

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

      {q.data === undefined && (q.isError
        ? <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        : <Skeleton rows={6} />)}
      {q.data && total === 0 && <EmptyState title={t('achievements.empty')} />}
      {q.data && total > 0 && (
        <>
          <div className={css.quest}>
            <div className={css.questTop}>
              <p id="achievements-progress">{t('achievements.progress', { unlocked, total })}</p>
              <span className={css.percent} aria-hidden="true">{Math.round((unlocked / total) * 100)} %</span>
            </div>
            <progress value={unlocked} max={total} aria-labelledby="achievements-progress" className={css.bar} />
            <div className={css.badges} aria-hidden="true">
              {q.data.map((a) => (
                <span key={a.id} className={css.badge} data-locked={!a.unlocked}>
                  {a.unlocked ? <Trophy size={18} /> : <Lock size={16} />}
                </span>
              ))}
            </div>
          </div>
          <ul data-list="my-achievements" className={css.grid}>
            {q.data.map((a) => (
              <li
                key={a.id}
                data-achievement-id={a.id}
                data-unlocked={a.unlocked}
                data-hidden={a.hidden}
                data-icon={a.iconKey ?? undefined}
                data-testid="achievement-item"
                className={css.frame}
              >
                <span className={css.emblem} aria-hidden="true">
                  {a.unlocked ? <Trophy size={26} /> : a.hidden ? <HelpCircle size={26} /> : <Lock size={24} />}
                </span>
                <h2>{a.name}</h2>
                <p>{a.description ?? t('landing.achievements.hiddenHint')}</p>
                <p className={css.status}>
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
