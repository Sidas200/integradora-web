import { useQuery } from '@tanstack/react-query'
import { ArrowRight, CalendarDays, Clock, Gamepad2, Hammer, History, Play, Save, Swords, Trophy } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { accountQuery } from '@/features/account'
import { recentHistoryQuery, Timeline } from '@/features/history'
import { ChapterLabel, latestSave, savesQuery } from '@/features/saves'
import { useSession } from '@/shared/auth'
import { formatLongDate } from '@/shared/ui/formatDate'
import { PageHeader } from '@/shared/ui/PageHeader'
import { CHARACTERS } from '@/shared/ui/art'
import { SkyScene } from '@/shared/ui/SkyScene'
import { EmptyState, ErrorState, Skeleton } from '@/shared/ui/states'
import { useDuration } from '@/shared/ui/useDuration'
import css from '../dashboard.module.css'

/**
 * /app (README §9.4): GET /account, /account/saves and /account/history?size=5.
 * Each block has its own four states, so one failing request does not hide the others.
 * Data already in the cache (or restored from IndexedDB) wins over a refresh that failed offline.
 * Layout: "continue playing" hero (Flix) + HUD widgets (EduVerse / Study Together).
 */
export function DashboardPage() {
  const { t } = useTranslation()
  const { player } = useSession()

  return (
    <section>
      <PageHeader title={t('pages.dashboard')}>
        {player && <p data-testid="greeting" className={css.greeting}>{t('dashboard.greeting', { username: player.username })}</p>}
      </PageHeader>
      <div className={css.board}>
        <LastSave />
        <AccountSummary />
        <RecentActivity />
      </div>
    </section>
  )
}

function Widget({ id, title, icon, className, testId, children }: {
  id: string
  title: string
  icon: ReactNode
  className?: string
  testId?: string
  children: ReactNode
}) {
  return (
    <section aria-labelledby={id} data-testid={testId} className={[css.widget, className].filter(Boolean).join(' ')}>
      <h2 id={id} className={css.widgetTitle}><span className={css.widgetIcon} aria-hidden="true">{icon}</span>{title}</h2>
      {children}
    </section>
  )
}

function AccountSummary() {
  const { t } = useTranslation()
  const duration = useDuration()
  const q = useQuery(accountQuery())

  if (q.data === undefined) {
    return (
      <div className={`${css.widget} ${css.summary}`}>
        {q.isError ? <ErrorState error={q.error} onRetry={() => void q.refetch()} /> : <Skeleton rows={4} />}
      </div>
    )
  }

  const { summary } = q.data
  const achievementsPct = summary.achievementsTotal
    ? Math.round((summary.achievementsUnlocked / summary.achievementsTotal) * 100)
    : 0

  return (
    <Widget id="dashboard-summary" title={t('dashboard.summary.title')} icon={<Gamepad2 size={18} />} className={css.summary}>
      <p className={css.member}>
        <CalendarDays size={14} aria-hidden="true" />
        {t('dashboard.memberSince', { date: formatLongDate(q.data.createdAt) })}
      </p>
      <dl data-list="account-summary" className={css.tiles}>
        <div data-tone="primary">
          <dt><Save size={16} aria-hidden="true" />{t('dashboard.summary.saves')}</dt>
          <dd>{summary.saves}</dd>
        </div>
        <div data-tone="hud">
          <dt><Clock size={16} aria-hidden="true" />{t('dashboard.summary.playTime')}</dt>
          <dd>{duration(summary.playTimeSec)}</dd>
        </div>
        <div data-tone="promise">
          <dt><Swords size={16} aria-hidden="true" />{t('dashboard.summary.enemies')}</dt>
          <dd>{summary.enemiesDefeated}</dd>
        </div>
        <div data-tone="mint">
          <dt><Hammer size={16} aria-hidden="true" />{t('dashboard.summary.crafted')}</dt>
          <dd>{summary.itemsCrafted}</dd>
        </div>
        <div data-tone="gold" className={css.achievementsTile}>
          <dt><Trophy size={16} aria-hidden="true" />{t('dashboard.summary.achievements')}</dt>
          <dd>
            {t('dashboard.summary.achievementsValue', {
              unlocked: summary.achievementsUnlocked,
              total: summary.achievementsTotal,
            })}
          </dd>
          <span className={css.ring} style={{ '--pct': achievementsPct } as CSSProperties} aria-hidden="true">
            <span>{achievementsPct}%</span>
          </span>
        </div>
        <div data-tone="neutral">
          <dt><History size={16} aria-hidden="true" />{t('dashboard.summary.lastSession')}</dt>
          <dd className={css.small}>{summary.lastSessionAt ? formatLongDate(summary.lastSessionAt) : t('dashboard.summary.never')}</dd>
        </div>
      </dl>
    </Widget>
  )
}

function LastSave() {
  const { t } = useTranslation()
  const duration = useDuration()
  const q = useQuery(savesQuery())
  const save = q.data ? latestSave(q.data) : undefined
  const sprite = save?.activeCharacter === 'HIKARI' ? CHARACTERS.hikari.sprite : CHARACTERS.tsuki.sprite

  return (
    <section aria-labelledby="dashboard-last-save" data-testid="last-save" className={css.hero}>
      <div className={css.heroScene} aria-hidden="true"><SkyScene variant="card" petals={10} /></div>
      {save && (
        <div className={css.heroSprite} aria-hidden="true">
          <img src={sprite} alt="" draggable={false} />
        </div>
      )}

      <div className={css.heroCard}>
        <h2 id="dashboard-last-save" className={css.heroEyebrow}>{t('dashboard.lastSave.title')}</h2>
        {q.data === undefined && (q.isError
          ? <ErrorState error={q.error} onRetry={() => void q.refetch()} />
          : <Skeleton rows={2} />)}
        {q.data && !save && (
          <EmptyState title={t('saves.empty.title')} text={t('saves.empty.text')} />
        )}
        {save && (
          <>
            <p className={css.heroTitle} aria-hidden="true">{t('saves.slot', { slot: save.slot })}</p>
            <p className={css.heroChips}>
              <span data-tone="promise">{t(`saves.characters.${save.activeCharacter}`)}</span>
              <span className={css.sep}> · </span>
              <span data-tone="primary"><ChapterLabel chapter={save.currentChapter} /></span>
              <span className={css.sep}> · </span>
              <span data-tone="hud"><Clock size={13} aria-hidden="true" />{duration(save.playTimeSec)}</span>
            </p>
            <p className={css.heroDate}>
              <time dateTime={save.updatedAt}>{t('saves.savedOn', { date: formatLongDate(save.updatedAt) })}</time>
            </p>
            <p className={css.heroCta}>
              <Link to={`/app/saves/${save.slot}`} className={css.play}>
                <span className={css.playIcon} aria-hidden="true"><Play size={16} fill="currentColor" /></span>
                {t('saves.open', { slot: save.slot })}
              </Link>
            </p>
          </>
        )}
      </div>
    </section>
  )
}

function RecentActivity() {
  const { t } = useTranslation()
  const q = useQuery(recentHistoryQuery(5))

  return (
    <Widget id="dashboard-activity" title={t('dashboard.activity.title')} icon={<History size={18} />}
            testId="recent-activity" className={css.activity}>
      {q.data === undefined && (q.isError
        ? <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        : <Skeleton rows={3} />)}
      {q.data?.length === 0 && (
        <EmptyState title={t('history.empty.title')} text={t('history.empty.text')} />
      )}
      {q.data && q.data.length > 0 && (
        <>
          <Timeline items={q.data} />
          <Link to="/app/history" className={css.seeAll}>
            {t('dashboard.activity.seeAll')}<ArrowRight size={16} aria-hidden="true" />
          </Link>
        </>
      )}
    </Widget>
  )
}
