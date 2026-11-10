import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { toApiError } from '@/shared/api/problems'
import { useOnline } from '@/shared/pwa/useOnline'
import { Button } from './Button'

/** Every list paints these four states (README §7.5): loading, error, empty and data. */

/**
 * Without network a query that has nothing saved waits (TanStack pauses it) instead of failing:
 * the skeleton then says it will appear when the connection is back, instead of loading forever.
 */
export function Skeleton({ rows = 3 }: { rows?: number }) {
  const { t } = useTranslation()
  const online = useOnline()
  return (
    <div aria-busy={online} aria-live="polite" data-state={online ? 'loading' : 'offline'}>
      <span>{online ? t('common.loading') : t('common.offlineUnavailable')}</span>
      <ul aria-hidden="true">
        {Array.from({ length: rows }, (_, i) => <li key={i} data-skeleton="" />)}
      </ul>
    </div>
  )
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { t } = useTranslation()
  const { code } = toApiError(error)
  return (
    <div role="alert" data-state="error">
      <p>{t(`errors.${code}`)}</p>
      {onRetry && <Button variant="outline" onClick={onRetry}>{t('common.retry')}</Button>}
    </div>
  )
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div data-state="empty">
      <p><strong>{title}</strong></p>
      {text && <p>{text}</p>}
      {action}
    </div>
  )
}