import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { CHARACTERS as ART, EMBLEM } from '@/shared/ui/art'
import css from '../landing.module.css'

/** Cast of the landing; the texts live in es.json under landing.characters.<id>. */
const CHARACTERS = ['tsuki', 'hikari', 'researcher'] as const

/**
 * Kamui card carousel: the card in the middle shows its face; the ones at the sides show the back.
 * Changing character flips the cards in 3D. Every card stays in the DOM, so all names can be read.
 */
export function CharactersSection() {
  const { t } = useTranslation()
  const [current, setCurrent] = useState(0)
  const total = CHARACTERS.length
  const go = (delta: number) => setCurrent((c) => (c + delta + total) % total)
  const positionOf = (i: number) => {
    const offset = (i - current + total) % total
    return offset === 0 ? 'center' : offset === 1 ? 'right' : 'left'
  }

  return (
    <section id="characters" aria-labelledby="characters-title" data-section="characters" className={`${css.section} ${css.dusk}`}>
      <div className={css.inner}>
        <div className={`${css.center} ${css.reveal}`}>
          <h2 id="characters-title" className={css.h2}>{t('landing.characters.title')}</h2>
        </div>
        <ul className={css.deck}>
          {CHARACTERS.map((id, i) => {
            const position = positionOf(i)
            const name = t(`landing.characters.${id}.name`)
            return (
              <li key={id} data-character={id} data-position={position} className={css.slot}>
                <article className={css.card} aria-current={position === 'center' ? 'true' : undefined}>
                  <div className={css.cardFace}>
                    <div className={css.portrait}>
                      <img src={ART[id].portrait.src} srcSet={ART[id].portrait.srcSet} sizes="320px"
                           alt="" aria-hidden="true" loading="lazy" decoding="async" draggable={false} />
                      <img src={ART[id].sprite} alt="" aria-hidden="true" className={css.sprite} loading="lazy" draggable={false} />
                    </div>
                    <div className={css.cardText}>
                      <p className={css.role}>{t(`landing.characters.${id}.role`)}</p>
                      <h3>{name}</h3>
                      <p><Trans i18nKey={`landing.characters.${id}.text`} components={{ b: <strong /> }} /></p>
                    </div>
                  </div>
                  <div className={css.cardBack} aria-hidden="true">
                    <img src={EMBLEM} alt="" loading="lazy" draggable={false} />
                  </div>
                </article>
                {position !== 'center' && (
                  <button type="button" className={css.slotButton} onClick={() => setCurrent(i)}
                          aria-label={t('landing.characters.show', { name })} />
                )}
              </li>
            )
          })}
        </ul>
        <div className={css.deckControls}>
          <button type="button" className={css.round} onClick={() => go(-1)} aria-label={t('landing.characters.prev')}>
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <div className={css.dots} aria-live="polite">
            <span className="visually-hidden">{t('landing.characters.position', { current: current + 1, total })}</span>
            {CHARACTERS.map((id, i) => <span key={id} data-active={i === current} aria-hidden="true" />)}
          </div>
          <button type="button" className={css.round} onClick={() => go(1)} aria-label={t('landing.characters.next')}>
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  )
}
