import { House } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { CHARACTERS, LOST } from '@/shared/ui/art'
import css from './pages.module.css'

/**
 * Shared look of the 404 and the route error: a lost character by the broken torii under the dead cherry tree, a big pixel code and an
 * RPG dialog box with the message. `heading` is the real h1 of the page.
 */
export function LostScreen({ code, heading, text, full = false }: {
  code: string
  heading: ReactNode
  text: string
  full?: boolean
}) {
  const { t } = useTranslation()
  return (
    <div className={css.lost} data-full={full || undefined}>
      <div className={css.scene} aria-hidden="true">
        <img src={LOST.src} srcSet={LOST.srcSet} sizes="100vw" alt="" decoding="async" draggable={false} />
        <span className={css.fallingPetal} /><span className={css.fallingPetal} /><span className={css.fallingPetal} />
      </div>
      <div className={css.stage}>
        <div className={css.codeRow} aria-hidden="true">
          <span className={css.code}>{code}</span>
          <img src={CHARACTERS.tsuki.sprite} alt="" className={css.sprite} draggable={false} />
        </div>
        <div className={css.dialog}>
          {heading}
          <p>{text}</p>
          <Link to="/" className={css.home}><House size={16} aria-hidden="true" />{t('notFound.home')}</Link>
        </div>
      </div>
    </div>
  )
}
