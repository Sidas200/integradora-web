import { ArrowUpRight, Gamepad2, Globe, Smartphone } from 'lucide-react'
import { useEffect } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { COVER_ART } from '@/shared/ui/art'
import { COMPANY, PRODUCTS } from '../company'
import { TEAM } from '../content/team'
import css from '../studio.module.css'

const PRODUCT_ICONS = { game: Gamepad2, web: Globe, mobile: Smartphone } as const

/** /nosotros: who Hex Studio is, what it builds, the team and how to reach it. */
export function AboutPage() {
  const { t } = useTranslation()
  useEffect(() => {
    document.title = `${t('studio.about.title')} · ${COMPANY.name}`
  }, [t])

  return (
    <div className={css.about}>
      <section className={css.aboutHero} aria-labelledby="about-title">
        <img src={COVER_ART.dusk.src} srcSet={COVER_ART.dusk.srcSet} sizes="100vw" alt="" aria-hidden="true" className={css.aboutHeroArt} />
        <div className={css.aboutHeroInner}>
          <h1 id="about-title">{t('studio.about.title')}</h1>
        </div>
      </section>

      <section className={css.block} aria-labelledby="products-title">
        <div className={css.blockHead}>
          <p className={css.kicker}>{t('studio.about.productsKicker')}</p>
          <h2 id="products-title">{t('studio.about.productsTitle')}</h2>
        </div>
        <ul className={css.products}>
          {PRODUCTS.map(({ id, repo }) => {
            const Icon = PRODUCT_ICONS[id]
            return (
              <li key={id} data-product={id}>
                <Icon size={22} aria-hidden="true" />
                <h3>{t(`studio.about.products.${id}.title`)}</h3>
                <p>{t(`studio.about.products.${id}.text`)}</p>
                <p className={css.tech}>{t(`studio.about.products.${id}.tech`)}</p>
                <a href={repo} target="_blank" rel="noreferrer" className={css.repo}>
                  {t('studio.about.repo')}<ArrowUpRight size={14} aria-hidden="true" />
                </a>
              </li>
            )
          })}
        </ul>
      </section>

      <section className={css.block} aria-labelledby="team-title">
        <div className={css.blockHead}>
          <p className={css.kicker}>{t('studio.about.teamKicker')}</p>
          <h2 id="team-title">{t('studio.about.teamTitle')}</h2>
          <p className={css.blockLead}>{t('studio.about.teamLead')}</p>
        </div>
        <ul className={css.team}>
          {TEAM.map((m) => (
            <li key={m.name} data-member={m.name}>
              <span className={css.portrait} aria-hidden="true" data-area={m.area}>
                <img src={m.sprite} alt="" loading="lazy" draggable={false} />
              </span>
              <h3>{m.name}</h3>
              <p>{m.role}</p>
              {m.scrum && <p className={css.scrum}>{m.scrum}</p>}
            </li>
          ))}
        </ul>
      </section>

      <section className={`${css.block} ${css.contact}`} aria-labelledby="contact-title">
        <h2 id="contact-title">{t('studio.about.contactTitle')}</h2>
        <p>{t('studio.about.contactText', { email: COMPANY.contactEmail })}</p>
        <p className={css.contactLinks}>
          <Link to="/news">{t('studio.about.contactNews')}</Link>
          <a href={COMPANY.github} target="_blank" rel="noreferrer">GitHub<ArrowUpRight size={14} aria-hidden="true" /></a>
        </p>
      </section>
    </div>
  )
}
