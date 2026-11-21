import { useTranslation } from 'react-i18next'
import { AchievementCatalog } from '@/features/achievements'
import { LatestNews } from '@/features/news'
import { AppSection } from '../components/AppSection'
import { BuySection } from '../components/BuySection'
import { CharactersSection } from '../components/CharactersSection'
import { Fireflies } from '../components/Fireflies'
import { GallerySection } from '../components/GallerySection'
import { HeroSection } from '../components/HeroSection'
import { LoopSection } from '../components/LoopSection'
import { StorySection } from '../components/StorySection'
import { SubscribeForm } from '../components/SubscribeForm'
import { TrailerSection } from '../components/TrailerSection'
import css from '../landing.module.css'

/** Anchors of the one-page landing, in the order they appear. */
const SECTIONS = ['story', 'trailer', 'loop', 'characters', 'gallery', 'achievements', 'news', 'app', 'buy'] as const

export function LandingPage() {
  const { t } = useTranslation()
  return (
    <div className={css.landing}>
      <HeroSection />

      <nav aria-label={t('nav.landing')} className={css.anchors}>
        <ul className="glass">
          {SECTIONS.map((id) => (
            <li key={id}>
              <a href={`#${id}`}>{t(`landing.sections.${id}`)}</a>
            </li>
          ))}
        </ul>
      </nav>

      <StorySection />
      <TrailerSection />
      <LoopSection />
      <CharactersSection />
      <GallerySection />

      <section id="achievements" aria-labelledby="achievements-title" data-section="achievements"
               className={`${css.section} ${css.night}`}>
        <Fireflies count={14} />
        <div className={css.inner}>
          <div className={`${css.center} ${css.reveal}`}>
            <h2 id="achievements-title" className={css.h2}>{t('landing.achievements.title')}</h2>
            <p className={css.lead}>{t('landing.achievements.text')}</p>
          </div>
          <AchievementCatalog />
        </div>
      </section>

      <section id="news" aria-labelledby="latest-news-title" data-section="news" className={css.section}>
        <div className={css.inner}>
          <h2 id="latest-news-title" className={`${css.h2} ${css.reveal}`}>{t('landing.news.title')}</h2>
          <LatestNews size={3} />
        </div>
      </section>

      <AppSection />

      <div className={`${css.section} ${css.closing}`}>
        <div className={`${css.inner} ${css.closingGrid}`}>
          <BuySection />
          <SubscribeForm />
        </div>
      </div>
    </div>
  )
}
