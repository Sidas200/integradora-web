import { ArrowRight, Bell, Play } from 'lucide-react'
import { useEffect, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { COVER_ART, SHOTS, SPRITE } from '@/shared/ui/art'
import { SkyScene } from '@/shared/ui/SkyScene'
import css from '../landing.module.css'

const INDEX = [
  { id: 'story', href: '#story' },
  { id: 'trailer', href: '#trailer' },
  { id: 'download', href: '#buy' },
] as const

/** Big petals that drift in front of everything, out of focus (Genshin's landing). */
const BIG_PETALS = [
  { x: '30%', y: '2%', size: 74, blur: 3, d: 15, delay: 0 },
  { x: '42%', y: '6%', size: 46, blur: 1, d: 12, delay: -4 },
  { x: '88%', y: '12%', size: 96, blur: 5, d: 18, delay: -8 },
  { x: '70%', y: '70%', size: 58, blur: 2, d: 14, delay: -2 },
  { x: '-3%', y: '58%', size: 110, blur: 6, d: 20, delay: -11 },
] as const

/**
 * First screen (Aurora + Genshin): the floating islands in parallax layers (they move with the
 * scroll), the game's name in large serif type, a tagline, two actions, a chip that points at the island, a page
 * indicator and big out-of-focus petals in front.
 */
export function HeroSection() {
  const { t } = useTranslation()

  useEffect(() => {
    document.title = t('app.name')
  }, [t])

  return (
    <section data-section="hero" className={css.hero}>
      <SkyScene variant="hero" />
      <div className={css.heroVeil} aria-hidden="true" />

      <div className={css.heroInner}>
        <div className={css.heroCopy}>
          {/* The game's name as text; the space between the spans keeps the accessible name intact. */}
          <h1 className={css.heroTitle}>
            <span className={css.heroTitleTop}>{t('landing.hero.titleTop')}</span>{' '}
            <span className={css.heroTitleMain}>{t('landing.hero.titleMain')}</span>
          </h1>
          <p className={css.heroHeadline}>
            <span>{t('landing.hero.headline1')}</span>{' '}
            <span className={css.heroAccent}>{t('landing.hero.headline2')}</span>
          </p>
          <p className={css.heroLead}>{t('landing.hero.lead')}</p>
          <ul data-actions="" className={css.heroActions}>
            <li>
              <a href="#buy" data-cta="buy" className={css.btnStart}>
                {t('landing.hero.ctaBuy')}
                <span className={css.btnStartIcon} aria-hidden="true"><ArrowRight size={16} /></span>
              </a>
            </li>
            <li>
              <a href="#subscribe" data-cta="notify" className={css.btnTrailer}>
                <span className={css.btnTrailerIcon} aria-hidden="true"><Bell size={16} /></span>
                {t('landing.hero.ctaNotify')}
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Chip pointing at the island (Aurora's "Sky City"): jumps to the trailer */}
      <a href="#trailer" className={css.islandChip}>
        <img src={SHOTS.duel.src} alt="" className={css.islandThumb} />
        <span>
          <strong>{t('landing.hero.islandTitle')}</strong>
          <small>{t('landing.hero.islandText')}</small>
        </span>
        <span className={css.islandArrow} aria-hidden="true"><Play size={12} fill="currentColor" /></span>
        <i className={css.islandLine} aria-hidden="true" />
      </a>

      {/* Featured sections 01 · 02 · 03 on the right edge (number + name on hover) */}
      <nav aria-label={t('landing.hero.indexLabel')} className={css.heroIndex}>
        <ol>
          {INDEX.map(({ href, id }, i) => (
            <li key={id}>
              <a href={href}><span>{String(i + 1).padStart(2, '0')}</span><em>{t(`landing.hero.index.${id}`)}</em></a>
            </li>
          ))}
        </ol>
      </nav>

      {/* Bottom row: explore link on the left, closing line on the right */}
      <div className={css.heroFooter}>
      <a href="#story" className={css.heroExplore}>
        <img src={COVER_ART.cliff.src} alt="" aria-hidden="true" />
        <span>
          <strong>{t('landing.hero.exploreTitle')}</strong>
          <small>{t('landing.hero.exploreText')}</small>
        </span>
      </a>
      <p className={css.heroQuote} aria-hidden="true">
        <span />{t('landing.hero.closing1')}<br /><em>{t('landing.hero.closing2')}</em>
      </p>
      </div>

      <div className={css.bigPetals} aria-hidden="true">
        {BIG_PETALS.map((p, i) => (
          <span key={i} style={{
            '--x': p.x, '--y': p.y, '--size': `${p.size}px`, '--blur': `${p.blur}px`,
            '--d': `${p.d}s`, '--delay': `${p.delay}s`, '--petal-img': `url("${SPRITE.petal}")`,
          } as CSSProperties} />
        ))}
      </div>
    </section>
  )
}
