import { useTranslation } from 'react-i18next'
import { MENU_ART, TRAILER_CAPTIONS_URL, TRAILER_URL } from '@/shared/ui/art'
import css from '../landing.module.css'

/** The demo trailer: a framed player that loads nothing until the visitor presses play. */
export function TrailerSection() {
  const { t } = useTranslation()
  return (
    <section id="trailer" aria-labelledby="trailer-title" data-section="trailer" className={`${css.section} ${css.trailerSection}`}>
      <div className={css.inner}>
        <div className={`${css.center} ${css.reveal}`}>
          <p className={css.eyebrow}>{t('landing.trailer.eyebrow')}</p>
          <h2 id="trailer-title" className={css.h2}>{t('landing.trailer.title')}</h2>
          <p className={css.lead}>{t('landing.trailer.text')}</p>
        </div>
        <div className={`${css.player} ${css.reveal}`}>
          <video controls playsInline preload="none" poster={MENU_ART.src} aria-label={t('landing.trailer.label')}>
            <source src={TRAILER_URL} type="video/mp4" />
            <track kind="captions" src={TRAILER_CAPTIONS_URL} srcLang="es" label={t('landing.trailer.captions')} />
          </video>
        </div>
      </div>
    </section>
  )
}
