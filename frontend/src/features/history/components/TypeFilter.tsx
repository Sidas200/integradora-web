import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui/Button'
import { HISTORY_TYPES, type HistoryType } from '../queries'

/** "Todo · Sesiones · Logros · Hitos". aria-pressed tells screen readers which one is active. */
export function TypeFilter({ value, onChange }: { value?: HistoryType; onChange: (type: HistoryType | undefined) => void }) {
  const { t } = useTranslation()
  const options: { type: HistoryType | undefined; label: string }[] = [
    { type: undefined, label: t('history.filter.all') },
    ...HISTORY_TYPES.map((type) => ({ type, label: t(`history.filter.${type}`) })),
  ]

  return (
    <div role="group" aria-label={t('history.filter.label')}>
      {options.map((o) => (
        <Button key={o.type ?? 'ALL'} variant="outline" aria-pressed={value === o.type} onClick={() => onChange(o.type)}>
          {o.label}
        </Button>
      ))}
    </div>
  )
}