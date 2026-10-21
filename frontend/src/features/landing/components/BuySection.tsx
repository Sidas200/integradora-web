import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui/Button'
import { STORE_URL } from '../config'

/** While there is no store page the button stays disabled with "Próximamente". */
export function BuySection() {
  const { t } = useTranslation()
  return (
    <section id="buy" aria-labelledby="buy-title" data-section="buy">
      <h2 id="buy-title">{t('landing.buy.title')}</h2>
      <p>{t('landing.buy.text')}</p>
      {STORE_URL ? (
        <a href={STORE_URL} target="_blank" rel="noopener noreferrer" data-cta="buy">{t('landing.buy.button')}</a>
      ) : (
        <Button variant="promise" disabled aria-describedby="buy-unavailable">{t('landing.buy.button')}</Button>
      )}
      {!STORE_URL && <p id="buy-unavailable">{t('landing.buy.unavailable')}</p>}
    </section>
  )
}