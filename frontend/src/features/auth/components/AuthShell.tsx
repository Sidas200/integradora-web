import { Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { CHARACTERS } from '@/shared/ui/art'
import { SkyScene } from '@/shared/ui/SkyScene'
import css from '../auth.module.css'

/**
 * Frame of /login and /register: an illustrated side (sky, island, the hero) and a glass card with
 * the form (Ananya / Kiana). The illustrated side is decorative; on phones it shrinks to a banner.
 */
export function AuthShell({ mode, children }: { mode: 'login' | 'register'; children: ReactNode }) {
  const { t } = useTranslation()
  const sprite = mode === 'login' ? CHARACTERS.tsuki.sprite : CHARACTERS.hikari.sprite

  return (
    <div className={css.shell} data-mode={mode}>
      <div className={css.art} aria-hidden="true">
        <SkyScene variant="card" petals={12} />
        <img src={sprite} alt="" className={css.artSprite} draggable={false} />
        <div className={css.artCopy}>
          <span className={css.artEyebrow}><Sparkles size={14} />{t('app.name')}</span>
          <p className={css.artTitle}>{t(`auth.art.${mode}.title`)}</p>
          <p className={css.artText}>{t(`auth.art.${mode}.text`)}</p>
        </div>
      </div>
      <div className={css.card}>{children}</div>
    </div>
  )
}
