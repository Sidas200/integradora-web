import type { ReactNode } from 'react'
import css from './Chip.module.css'

/** Small pill label: chapter, item type, rarity, platform... `tone` only changes the color. */
export function Chip({ children, tone = 'neutral', icon }: {
  children: ReactNode
  tone?: 'neutral' | 'promise' | 'primary' | 'gold' | 'success' | 'hud'
  icon?: ReactNode
}) {
  return (
    <span className={css.chip} data-tone={tone}>
      {icon}
      {children}
    </span>
  )
}
