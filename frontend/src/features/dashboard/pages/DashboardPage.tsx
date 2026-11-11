import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { accountQuery } from '@/features/account'
import { recentHistoryQuery, Timeline } from '@/features/history'
import { ChapterLabel, latestSave, savesQuery } from '@/features/saves'
import { useSession } from '@/shared/auth'
import { formatLongDate } from '@/shared/ui/formatDate'
import { PageHeader } from '@/shared/ui/PageHeader'
import { EmptyState, ErrorState, Skeleton } from '@/shared/ui/states'
import { useDuration } from '@/shared/ui/useDuration'

/**
 * /app (README §9.4): GET /account, /account/saves and /account/history?size=5.
 * Each block has its own four states, so one failing request does not hide the others.
 * Data already in the cache (or restored from IndexedDB) wins over a refresh that failed offline.
 */
export function DashboardPage() {
  const { t } = useTranslation()
  const { player } = useSession()

  return (
    <section>
      <PageHeader title={t('pages.dashboard')}>
        {player && <p data-testid="greeting">{t('dashboard.greeting', { username: player.username })}</p>}
      </PageHeader>
      <AccountSummary />
      <LastSave />
      <RecentActivity />
    </section>
  )
}

function AccountSummary() {
  const { t } = useTranslation()
  const duration = useDuration()
  const q = useQuery(accountQuery())

  if (q.data === undefined) {
    return q.isError ? <ErrorState error={q.error} onRetry={() => void q.refetch()} /> : <Skeleton rows={4} />
  }

  const { summary } = q.data
  return (
    <section aria-labelledby="dashboard-summary">
      <p>{t('dashboard.memberSince', { date: formatLongDate(q.data.createdAt) })}</p>
      <h2 id="dashboard-summary">{t('dashboard.summary.title')}</h2>
      <dl data-list="account-summary">
        <dt>{t('dashboard.summary.saves')}</dt>
        <dd>{summary.saves}</dd>
        <dt>{t('dashboard.summary.playTime')}</dt>
        <dd>{duration(summary.playTimeSec)}</dd>
        <dt>{t('dashboard.summary.enemies')}</dt>
        <dd>{summary.enemiesDefeated}</dd>
        <dt>{t('dashboard.summary.crafted')}</dt>
        <dd>{summary.itemsCrafted}</dd>
        <dt>{t('dashboard.summary.achievements')}</dt>
        <dd>
          {t('dashboard.summary.achievementsValue', {
            unlocked: summary.achievementsUnlocked,
            total: summary.achievementsTotal,
          })}
        </dd>
        <dt>{t('dashboard.summary.lastSession')}</dt>
        <dd>{summary.lastSessionAt ? formatLongDate(summary.lastSessionAt) : t('dashboard.summary.never')}</dd>
      </dl>
    </section>
  )
}

function LastSave() {
  const { t } = useTranslation()
  const duration = useDuration()
  const q = useQuery(savesQuery())
  const save = q.data ? latestSave(q.data) : undefined

  return (
    <section aria-labelledby="dashboard-last-save" data-testid="last-save">
      <h2 id="dashboard-last-save">{t('dashboard.lastSave.title')}</h2>
      {q.data === undefined && (q.isError
        ? <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        : <Skeleton rows={2} />)}
      {q.data && !save && (
        <EmptyState title={t('saves.empty.title')} text={t('saves.empty.text')} />
      )}
      {save && (
        <>
          <p>
            <Link to={`/app/saves/${save.slot}`}>{t('saves.open', { slot: save.slot })}</Link>
          </p>
          <p>
            {t(`saves.characters.${save.activeCharacter}`)} · <ChapterLabel chapter={save.currentChapter} />
            {' · '}
            {duration(save.playTimeSec)}
          </p>
          <p>
            <time dateTime={save.updatedAt}>{t('saves.savedOn', { date: formatLongDate(save.updatedAt) })}</time>
          </p>
        </>
      )}
    </section>
  )
}

function RecentActivity() {
  const { t } = useTranslation()
  const q = useQuery(recentHistoryQuery(5))

  return (
    <section aria-labelledby="dashboard-activity" data-testid="recent-activity">
      <h2 id="dashboard-activity">{t('dashboard.activity.title')}</h2>
      {q.data === undefined && (q.isError
        ? <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        : <Skeleton rows={3} />)}
      {q.data?.length === 0 && (
        <EmptyState title={t('history.empty.title')} text={t('history.empty.text')} />
      )}
      {q.data && q.data.length > 0 && (
        <>
          <Timeline items={q.data} />
          <Link to="/app/history">{t('dashboard.activity.seeAll')}</Link>
        </>
      )}
    </section>
  )
}