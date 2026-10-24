import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { accountQuery } from '@/features/account'
import { useSession } from '@/shared/auth'
import { formatLongDate } from '@/shared/ui/formatDate'
import { PageHeader } from '@/shared/ui/PageHeader'
import { ErrorState, Skeleton } from '@/shared/ui/states'

/**
 * Minimal summary (phase 3): proves that /account answers with the session's token.
 * Phase 7 turns it into the full dashboard.
 */
export function DashboardPage() {
  const { t } = useTranslation()
  const { player } = useSession()
  const q = useQuery(accountQuery())

  const duration = (seconds: number) =>
    t('dashboard.hours', { hours: Math.floor(seconds / 3600), minutes: Math.floor((seconds % 3600) / 60) })

  return (
    <section>
      <PageHeader title={t('pages.dashboard')}>
        {player && <p data-testid="greeting">{t('dashboard.greeting', { username: player.username })}</p>}
      </PageHeader>

      {q.isPending && <Skeleton rows={4} />}
      {q.isError && <ErrorState error={q.error} onRetry={() => void q.refetch()} />}
      {q.isSuccess && (
        <>
          <p>{t('dashboard.memberSince', { date: formatLongDate(q.data.createdAt) })}</p>
          <h2>{t('dashboard.summary.title')}</h2>
          <dl data-list="account-summary">
            <dt>{t('dashboard.summary.saves')}</dt>
            <dd>{q.data.summary.saves}</dd>
            <dt>{t('dashboard.summary.playTime')}</dt>
            <dd>{duration(q.data.summary.playTimeSec)}</dd>
            <dt>{t('dashboard.summary.enemies')}</dt>
            <dd>{q.data.summary.enemiesDefeated}</dd>
            <dt>{t('dashboard.summary.crafted')}</dt>
            <dd>{q.data.summary.itemsCrafted}</dd>
            <dt>{t('dashboard.summary.achievements')}</dt>
            <dd>
              {t('dashboard.summary.achievementsValue', {
                unlocked: q.data.summary.achievementsUnlocked,
                total: q.data.summary.achievementsTotal,
              })}
            </dd>
            <dt>{t('dashboard.summary.lastSession')}</dt>
            <dd>
              {q.data.summary.lastSessionAt
                ? formatLongDate(q.data.summary.lastSessionAt)
                : t('dashboard.summary.never')}
            </dd>
          </dl>
        </>
      )}
    </section>
  )
}