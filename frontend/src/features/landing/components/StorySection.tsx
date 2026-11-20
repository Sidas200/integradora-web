import { Trans, useTranslation } from 'react-i18next'
import { SPRITE, STORY_NIGHT } from '@/shared/ui/art'
import { Fireflies } from './Fireflies'
import css from '../landing.module.css'

/** "Kamui" night section: the text on the left, the crimson sword under the moon on the right, in a lantern-lit frame. Always dark. */
export function StorySection() {
  const { t } = useTranslation()
  return (
    <section id="story" aria-labelledby="story-title" data-section="story" className={`${css.section} ${css.night}`}>
      <Fireflies count={16} />
      <div className={`${css.inner} ${css.split}`}>
        <div className={css.reveal}>
          <p className={css.eyebrow}>{t('landing.story.eyebrow')}</p>
          <h2 id="story-title" className={css.h2}>{t('landing.story.title')}</h2>
          <p className={css.lead}><Trans i18nKey="landing.story.p1" components={{ b: <strong /> }} /></p>
          <p>{t('landing.story.p2')}</p>
          <p>{t('landing.story.p3')}</p>
        </div>
        <figure className={`${css.storyArt} ${css.reveal}`} aria-hidden="true">
          <img src={STORY_NIGHT.src} srcSet={STORY_NIGHT.srcSet} sizes="(min-width: 900px) 40vw, 90vw"
               alt="" loading="lazy" decoding="async" draggable={false} />
          <img src={SPRITE.lantern} alt="" className={`${css.storyLantern} ${css.flicker}`} draggable={false} />
          <img src={SPRITE.lantern} alt="" className={`${css.storyLantern} ${css.storyLanternRight} ${css.flicker}`}
               style={{ animationDelay: '-1.2s' }} draggable={false} />
        </figure>
      </div>
    </section>
  )
}
