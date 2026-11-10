import { useTranslation } from 'react-i18next'
import { formatDateTime } from '@/shared/ui/formatDate'
import { useDuration } from '@/shared/ui/useDuration'
import type { HistoryItem } from '../queries'

/** One line per entry of the history. Used by /app/history and the dashboard. */
export function Timeline({ items }: { items: HistoryItem[] }) {
  return (
    <ol data-list="history">
      {items.map((item) => (
        <li key={`${item.type}-${item.slot ?? 0}-${item.referenceId}`} data-type={item.type} data-testid="history-item">
          <TimelineEntry item={item} />
        </li>
      ))}
    </ol>
  )
}

function TimelineEntry({ item }: { item: HistoryItem }) {
  const { t } = useTranslation()
  const duration = useDuration()

  const details: string[] = []
  if (item.slot) details.push(t('history.slot', { slot: item.slot }))
  if (item.valueSec !== null && item.valueSec !== undefined) {
    details.push(item.type === 'SESSION'
      ? duration(item.valueSec)
      : t('history.atPlayTime', { duration: duration(item.valueSec) }))
  }

  return (
    <>
      <p><strong>{t(`history.item.${item.type}`, { title: item.title ?? '' })}</strong></p>
      {details.length > 0 && <p>{details.join(' · ')}</p>}
      <time dateTime={item.occurredAt}>{formatDateTime(item.occurredAt)}</time>
    </>
  )
}