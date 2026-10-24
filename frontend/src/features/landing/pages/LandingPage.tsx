import { useTranslation } from 'react-i18next'
import { AchievementCatalog } from '@/features/achievements'
import { LatestNews } from '@/features/news'
import { BuySection } from '../components/BuySection'
import { CharactersSection } from '../components/CharactersSection'
import { HeroSection } from '../components/HeroSection'
import { LoopSection } from '../components/LoopSection'
import { SpecsSection } from '../components/SpecsSection'
import { StorySection } from '../components/StorySection'
import { SubscribeForm } from '../components/SubscribeForm'

/** Anchors of the one-page landing, in the order they appear. */
const SECTIONS = ['story', 'loop', 'characters', 'specs', 'achievements', 'news', 'buy'] as const

export function LandingPage() {
  const { t } = useTranslation()
  return (
    <>
      <HeroSection />

      <nav aria-label={t('nav.landing')}>
        <ul>
          {SECTIONS.map((id) => (
            <li key={id}><a href={`#${id}`}>{t(`landing.sections.${id}`)}</a></li>
          ))}
        </ul>
      </nav>

      <StorySection />
      <LoopSection />
      <CharactersSection />
      <SpecsSection />

      <section id="achievements" aria-labelledby="achievements-title" data-section="achievements">
        <h2 id="achievements-title">{t('landing.achievements.title')}</h2>
        <p>{t('landing.achievements.text')}</p>
        <AchievementCatalog />
      </section>

      <section id="news" aria-labelledby="latest-news-title" data-section="news">
        <h2 id="latest-news-title">{t('landing.news.title')}</h2>
        <LatestNews size={3} />
      </section>

      <BuySection />
      <SubscribeForm />
    </>
  )
}