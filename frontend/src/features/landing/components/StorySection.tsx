import { useTranslation } from 'react-i18next'

export function StorySection() {
  const { t } = useTranslation()
  return (
    <section id="story" aria-labelledby="story-title" data-section="story">
      <h2 id="story-title">{t('landing.story.title')}</h2>
      <p>{t('landing.story.p1')}</p>
      <p>{t('landing.story.p2')}</p>
      <p>{t('landing.story.p3')}</p>
    </section>
  )
}