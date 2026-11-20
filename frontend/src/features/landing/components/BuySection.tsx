import { ShoppingBag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { InstallButton } from '@/shared/pwa'
import { Button } from '@/shared/ui/Button'
import { STORE_URL } from '../config'
import css from '../landing.module.css'

/** While there is no store page the button stays disabled with "Próximamente". */
export function BuySection() {
  const { t } = useTranslation()
  return (
    <section id="buy" aria-labelledby="buy-title" data-section="buy" className={`${css.panel} ${css.buy} glass`}>
      <p className={css.eyebrow}>{t('landing.buy.eyebrow')}</p>
      <h2 id="buy-title" className={css.h2}>{t('landing.buy.title')}</h2>
      <p>{t('landing.buy.text')}</p>
      <div className={css.buyActions}>
        {STORE_URL ? (
          <a href={STORE_URL} target="_blank" rel="noopener noreferrer" data-cta="buy" className={css.btnPromise}>
            <ShoppingBag size={18} aria-hidden="true" />{t('landing.buy.button')}
          </a>
        ) : (
          <Button variant="promise" disabled aria-describedby="buy-unavailable">
            <ShoppingBag size={18} aria-hidden="true" />{t('landing.buy.button')}
          </Button>
        )}
        <InstallButton />
      </div>
      {!STORE_URL && <p id="buy-unavailable" className={css.soon}>{t('landing.buy.unavailable')}</p>}
    </section>
  )
}
