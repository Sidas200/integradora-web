import { Flag, Gamepad2, LayoutGrid, Trophy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { HISTORY_TYPES, type HistoryType } from '../queries'
import css from '../history.module.css'

const ICONS = { ALL: LayoutGrid, SESSION: Gamepad2, ACHIEVEMENT: Trophy, MILESTONE: Flag } as const

/** "Todo · Sesiones · Logros · Hitos" as big chips (Flix categories). aria-pressed marks the active one. */
export function TypeFilter({ value, onChange }: { value?: HistoryType; onChange: (type: HistoryType | undefined) => void }) {
  const { t } = useTranslation()
  const options: { type: HistoryType | undefined; label: string }[] = [
    { type: undefined, label: t('history.filter.all') },
    ...HISTORY_TYPES.map((type) => ({ type, label: t(`history.filter.${type}`) })),
  ]

  return (
    <div role="group" aria-label={t('history.filter.label')} className={css.filter}>
      {options.map((o) => {
        const Icon = ICONS[o.type ?? 'ALL']
        return (
          <button key={o.type ?? 'ALL'} type="button" className={css.chip} aria-pressed={value === o.type} onClick={() => onChange(o.type)}>
            <Icon size={18} aria-hidden="true" />
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
