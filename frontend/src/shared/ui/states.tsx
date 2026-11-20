import { CloudOff, RotateCcw, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { toApiError } from '@/shared/api/problems'
import { useOnline } from '@/shared/pwa/useOnline'
import { Button } from './Button'
import css from './states.module.css'

/** Every list paints these four states (README §7.5): loading, error, empty and data. */

/**
 * Without network a query that has nothing saved waits (TanStack pauses it) instead of failing:
 * the skeleton then says it will appear when the connection is back, instead of loading forever.
 */
export function Skeleton({ rows = 3 }: { rows?: number }) {
  const { t } = useTranslation()
  const online = useOnline()
  return (
    <div aria-busy={online} aria-live="polite" data-state={online ? 'loading' : 'offline'} className={css.skeleton}>
      <span className={online ? 'visually-hidden' : css.offline}>
        {!online && <CloudOff size={18} aria-hidden="true" />}
        {online ? t('common.loading') : t('common.offlineUnavailable')}
      </span>
      <ul aria-hidden="true">
        {Array.from({ length: rows }, (_, i) => <li key={i} data-skeleton="" style={{ animationDelay: `${i * 90}ms` }} />)}
      </ul>
    </div>
  )
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { t } = useTranslation()
  const { code } = toApiError(error)
  return (
    <div role="alert" data-state="error" className={css.error}>
      <TriangleAlert size={20} aria-hidden="true" className={css.errorIcon} />
      <p>{t(`errors.${code}`)}</p>
      {onRetry && (
        <Button variant="outline" size="s" onClick={onRetry}>
          <RotateCcw size={14} aria-hidden="true" />
          {t('common.retry')}
        </Button>
      )}
    </div>
  )
}

/** RPG dialog box: "* Todavía no hay actividad…" */
export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div data-state="empty" className={css.empty}>
      <p className={css.emptyTitle}><strong>{title}</strong></p>
      {text && <p className={css.emptyText}>{text}</p>}
      {action && <div className={css.emptyAction}>{action}</div>}
      <span className={css.caret} aria-hidden="true">▼</span>
    </div>
  )
}
