import { Compass, Crown, Hammer, Pickaxe, Swords } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'
import { COVER_ART, type ArtImage } from '@/shared/ui/art'
import { PixelForest } from './PixelForest'
import css from '../landing.module.css'

/** Order of the game loop; the texts live in es.json under landing.loop.<step> (verb, title, lore, play). */
type StepId = 'explore' | 'fight' | 'collect' | 'forge' | 'guardian'

const STEPS: readonly { id: StepId; Icon: typeof Compass; art: ArtImage }[] = [
  { id: 'explore', Icon: Compass, art: COVER_ART.bridge },
  { id: 'fight', Icon: Swords, art: COVER_ART.cliff },
  { id: 'collect', Icon: Pickaxe, art: COVER_ART.ruins },
  { id: 'forge', Icon: Hammer, art: COVER_ART.forge },
  { id: 'guardian', Icon: Crown, art: COVER_ART.torii },
]

/**
 * The game loop told as chapters of the story: each step pairs an illustration with a piece of lore
 * and what the player does in the game. Rows alternate sides on wide screens.
 */
export function LoopSection() {
  const { t } = useTranslation()
  return (
    <section id="loop" aria-labelledby="loop-title" data-section="loop" className={`${css.section} ${css.mint}`}>
      <div className={css.inner}>
        <div className={`${css.center} ${css.reveal}`}>
          <p className={css.eyebrow}>{t('landing.loop.eyebrow')}</p>
          <h2 id="loop-title" className={css.h2}>{t('landing.loop.title')}</h2>
          <p className={css.lead}>{t('landing.loop.lead')}</p>
        </div>
        <ol className={css.chapters}>
          {STEPS.map(({ id, Icon, art }) => (
            <li key={id} data-step={id} className={`${css.chapter} ${css.reveal}`}>
              <figure className={css.chapterArt} aria-hidden="true">
                <img src={art.src} srcSet={art.srcSet} sizes="(min-width: 900px) 560px, 92vw" alt="" loading="lazy" decoding="async" draggable={false} />
              </figure>
              <div className={css.chapterText}>
                <p className={css.chapterVerb}><Icon size={16} aria-hidden="true" />{t(`landing.loop.${id}.verb`)}</p>
                <h3>{t(`landing.loop.${id}.title`)}</h3>
                <p className={css.chapterLore}><Trans i18nKey={`landing.loop.${id}.lore`} components={{ b: <strong /> }} /></p>
                <p className={css.chapterPlay}><strong>{t('landing.loop.inGame')}</strong> {t(`landing.loop.${id}.play`)}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <PixelForest />
    </section>
  )
}
