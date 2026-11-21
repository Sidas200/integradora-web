import { Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { InstallButton } from '@/shared/pwa'
import { TSUKI_ART } from '@/shared/ui/art'
import { GAME_DOWNLOAD_URL } from '../config'
import css from '../landing.module.css'

const REQUIREMENTS = ['os', 'gpu', 'disk', 'input'] as const

/** Download of the chapter 1 demo for Windows, with the minimum requirements and Tsuki beside it. */
export function BuySection() {
  const { t } = useTranslation()
  return (
    <section id="buy" aria-labelledby="buy-title" data-section="buy" className={`${css.panel} ${css.buy} glass`}>
      <img src={TSUKI_ART.src} srcSet={TSUKI_ART.srcSet} sizes="320px" alt="" aria-hidden="true"
           className={css.buyArt} loading="lazy" decoding="async" draggable={false} />
      <div className={css.buyBody}>
        <p className={css.eyebrow}>{t('landing.buy.eyebrow')}</p>
        <h2 id="buy-title" className={css.h2}>{t('landing.buy.title')}</h2>
        <p>{t('landing.buy.text')}</p>
        <div className={css.buyActions}>
          <a href={GAME_DOWNLOAD_URL} target="_blank" rel="noopener noreferrer" data-cta="buy" className={css.btnPromise}>
            <Download size={18} aria-hidden="true" />{t('landing.buy.button')}
          </a>
          <InstallButton />
        </div>
        <p className={css.soon}>{t('landing.buy.note')}</p>
        <h3 className={css.reqTitle}>{t('landing.buy.requirementsTitle')}</h3>
        <dl className={css.requirements}>
          {REQUIREMENTS.map((id) => {
            const [label, value] = t(`landing.buy.requirements.${id}`, { returnObjects: true }) as [string, string]
            return <div key={id}><dt>{label}</dt><dd>{value}</dd></div>
          })}
        </dl>
      </div>
    </section>
  )
}
