import { useInfiniteQuery } from '@tanstack/react-query'
import { Monitor } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui/Button'
import { formatDateTime } from '@/shared/ui/formatDate'
import { EmptyState, ErrorState, Skeleton } from '@/shared/ui/states'
import { useDuration } from '@/shared/ui/useDuration'
import { slotSessionsInfiniteQuery } from '../queries'
import css from '../saves.module.css'

/** Play sessions of one slot with the four states and "Cargar más" (README §7.5). */
export function SessionList({ slot }: { slot: number }) {
  const { t } = useTranslation()
  const duration = useDuration()
  const q = useInfiniteQuery(slotSessionsInfiniteQuery(slot))

  if (q.isPending) return <Skeleton rows={3} />
  if (q.isError) return <ErrorState error={q.error} onRetry={() => void q.refetch()} />

  const sessions = q.data.pages.flatMap((p) => p.content)
  const total = q.data.pages[0]?.page.totalElements ?? 0
  if (sessions.length === 0) return <EmptyState title={t('saves.sessions.empty')} />

  return (
    <div data-list="sessions">
      <p aria-live="polite" className={css.count}>{t('saves.sessions.count', { shown: sessions.length, total })}</p>
      <ul className={css.sessions}>
        {sessions.map((s) => (
          <li key={s.id} data-testid="session-item" data-open={s.durationSec === null || s.durationSec === undefined}>
            <span className={css.sessionIcon} aria-hidden="true"><Monitor size={16} /></span>
            <time dateTime={s.startedAt}>{formatDateTime(s.startedAt)}</time>
            {' · '}
            {s.durationSec === null || s.durationSec === undefined ? t('saves.sessions.unfinished') : duration(s.durationSec)}
            {' · '}
            {t(`saves.platforms.${s.platform}`)}
          </li>
        ))}
      </ul>
      {q.hasNextPage && (
        <Button variant="outline" size="s" className={css.more} onClick={() => void q.fetchNextPage()} loading={q.isFetchingNextPage}>
          {t('common.loadMore')}
        </Button>
      )}
    </div>
  )
}
