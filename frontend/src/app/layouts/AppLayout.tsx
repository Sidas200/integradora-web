import { CloudOff } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useSession } from '@/shared/auth'
import { InstallButton } from '@/shared/pwa'
import css from './AppLayout.module.css'

const LINKS = [
  { to: '/app', end: true, label: 'nav.dashboard' },
  { to: '/app/saves', label: 'nav.saves' },
  { to: '/app/history', label: 'nav.history' },
  { to: '/app/achievements', label: 'nav.achievements' },
  { to: '/app/account', label: 'nav.myAccount' },
] as const

/**
 * Player account area (/app/...), like a publisher's account portal: a band with the player and a
 * row of section tabs, then the page on the plain background. Same layout on phone and desktop
 * (the tabs scroll sideways when they do not fit).
 */
export function AppLayout() {
  const { t } = useTranslation()
  const { status, player } = useSession()
  return (
    <div className={css.shell}>
      <div className={css.band}>
        <div className={css.bandInner}>
          {player && (
            <div className={css.player} aria-hidden="true">
              <span className={css.avatar}>{player.username.slice(0, 1).toUpperCase()}</span>
              <span>
                <strong>{player.username}</strong>
                <small>{t('app.playerAccount')}</small>
              </span>
            </div>
          )}
          <div className={css.install}><InstallButton /></div>
        </div>
        <nav aria-label={t('nav.app')} className={css.tabs}>
          <ul>
            {LINKS.map(({ to, label, ...rest }) => (
              <li key={to}>
                <NavLink to={to} end={'end' in rest} className={css.tab}>{t(label)}</NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className={css.content}>
        {status === 'offline' && (
          <p role="status" data-notice="read-only" className={css.readOnly}>
            <CloudOff size={18} aria-hidden="true" />
            {t('readOnly.notice')}
          </p>
        )}
        <Outlet />
      </div>
    </div>
  )
}
