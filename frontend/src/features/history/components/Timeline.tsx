import { Flag, Gamepad2, Trophy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatDateTime } from '@/shared/ui/formatDate'
import { useDuration } from '@/shared/ui/useDuration'
import type { HistoryItem } from '../queries'
import css from '../history.module.css'

const ICONS = { SESSION: Gamepad2, ACHIEVEMENT: Trophy, MILESTONE: Flag } as const

/** One row per entry ("Continue Progress" of EduVerse). Used by /app/history and the dashboard. */
export function Timeline({ items }: { items: HistoryItem[] }) {
  return (
    <ol data-list="history" className={css.timeline}>
      {items.map((item, i) => (
        <li key={`${item.type}-${item.slot ?? 0}-${item.referenceId}`} data-type={item.type} data-testid="history-item"
            className={css.item} style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}>
          <TimelineEntry item={item} />
        </li>
      ))}
    </ol>
  )
}

function TimelineEntry({ item }: { item: HistoryItem }) {
  const { t } = useTranslation()
  const duration = useDuration()
  const Icon = ICONS[item.type]

  const details: string[] = []
  if (item.slot) details.push(t('history.slot', { slot: item.slot }))
  if (item.valueSec !== null && item.valueSec !== undefined) {
    details.push(item.type === 'SESSION'
      ? duration(item.valueSec)
      : t('history.atPlayTime', { duration: duration(item.valueSec) }))
  }

  return (
    <>
      <span className={css.icon} aria-hidden="true"><Icon size={20} strokeWidth={2.2} /></span>
      <div className={css.text}>
        <p className={css.title}><strong>{t(`history.item.${item.type}`, { title: item.title ?? '' })}</strong></p>
        {details.length > 0 && <p className={css.details}>{details.join(' · ')}</p>}
      </div>
      <time dateTime={item.occurredAt} className={css.time}>{formatDateTime(item.occurredAt)}</time>
    </>
  )
}
