import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { HEX } from '@/shared/ui/art'
import { MOBILE_APP_URL } from '@/features/landing'
import { COMPANY } from '../company'
import css from '../studio.module.css'


type FooterLink = { label: string; to?: string; href?: string; download?: boolean }

/** Company footer (publisher style): brand, link columns, legal line. Always dark. */
export function SiteFooter() {
  const { t } = useTranslation()
  const year = new Date().getFullYear()

  const columns: { id: string; title: string; links: FooterLink[] }[] = [
    {
      id: 'game', title: t('studio.footer.game'), links: [
        { label: t('landing.sections.story'), to: '/#story' },
        { label: t('landing.sections.characters'), to: '/#characters' },
        { label: t('landing.sections.loop'), to: '/#loop' },
        { label: t('nav.news'), to: '/news' },
      ],
    },
    {
      id: 'studio', title: COMPANY.name, links: [
        { label: t('studio.footer.about'), to: '/nosotros' },
        { label: t('studio.footer.contact'), to: '/nosotros#contact-title' },
        { label: 'GitHub', href: COMPANY.github },
      ],
    },
    {
      id: 'players', title: t('studio.footer.players'), links: [
        { label: t('nav.myAccount'), to: '/app' },
        { label: t('nav.register'), to: '/register' },
        { label: t('studio.footer.android'), href: MOBILE_APP_URL, download: true },
      ],
    },
    {
      id: 'legal', title: t('studio.footer.legal'), links: [
        { label: t('studio.footer.privacy'), to: '/privacidad' },
        { label: t('studio.footer.cookies'), to: '/cookies' },
      ],
    },
  ]

  return (
    <footer className={css.footer}>
      <div className={css.footerInner}>
        <div className={css.footerBrand}>
          <Link to="/nosotros" className={css.studioLogo} aria-label={COMPANY.name}>
            <img src={HEX.mark} alt="" width={128} height={131} className={css.studioMark} />
            <img src={HEX.wordmark} alt="" width={240} height={93} className={css.studioWord} />
          </Link>
        </div>
        {columns.map((col) => (
          <nav key={col.id} aria-label={col.title} className={css.footerCol}>
            <p className={css.footerTitle}>{col.title}</p>
            <ul>
              {col.links.map((l) => (
                <li key={l.label}>
                  {l.to
                    ? <Link to={l.to}>{l.label}</Link>
                    : l.download
                      ? <a href={l.href} download>{l.label}</a>
                      : <a href={l.href} target="_blank" rel="noreferrer">{l.label}<ArrowUpRight size={12} aria-hidden="true" /></a>}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className={css.footerLegal}>
        <p>{t('studio.footer.copyright', { year, studio: COMPANY.name })}</p>
        <p>{t('studio.footer.trademark', { studio: COMPANY.name })}</p>
      </div>
    </footer>
  )
}
