import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/shared/ui/PageHeader'

/** First screen: name, promise of the game and the two actions (buy, get notified). */
export function HeroSection() {
  const { t } = useTranslation()
  return (
    <section data-section="hero">
      <PageHeader title={t('app.name')}>
        <p>{t('landing.hero.kicker')}</p>
        <p>{t('landing.hero.tagline')}</p>
      </PageHeader>
      <ul data-actions="">
        <li><a href="#buy" data-cta="buy">{t('landing.hero.ctaBuy')}</a></li>
        <li><a href="#subscribe" data-cta="notify">{t('landing.hero.ctaNotify')}</a></li>
      </ul>
    </section>
  )
}