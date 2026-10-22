import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { toApiError } from '@/shared/api/problems'
import { Button } from './Button'

/** Every list paints these four states (README §7.5): loading, error, empty and data. */

export function Skeleton({ rows = 3 }: { rows?: number }) {
  const { t } = useTranslation()
  return (
    <div aria-busy="true" aria-live="polite" data-state="loading">
      <span>{t('common.loading')}</span>
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