import { Home, LogIn, LogOut, Newspaper, UserRound, UserRoundPlus, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, ScrollRestoration, useLocation, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { SiteFooter } from '@/features/studio'
import { endSession, revokeSession, scheduleEndSession, takeScheduledEnd, useSession } from '@/shared/auth'
import { OfflineBanner, UpdatePrompt } from '@/shared/pwa'
import { ThemeToggle } from '@/shared/theme'
import { Button } from '@/shared/ui/Button'
import { Logo } from '@/shared/ui/Logo'
import css from './PublicLayout.module.css'

/** Notices another page leaves in the navigation state (for example after deleting the account). */
type Notice = 'accountDeleted'

const navClass = ({ isActive }: { isActive: boolean }) => (isActive ? `${css.pill} ${css.active}` : css.pill)

/** Frame of every page: skip link, floating glass navigation, content and the company footer. */
export function PublicLayout() {
  const { t } = useTranslation()
  const { status, player } = useSession()
  const navigate = useNavigate()
  const location = useLocation()
  const [signingOut, setSigningOut] = useState(false)
  const notice = (location.state as { notice?: Notice } | null)?.notice
  const signedIn = status === 'authenticated' || status === 'offline'
  // In read-only mode the player panel already explains the situation (AppLayout); one notice is enough.
  const panelExplainsOffline = status === 'offline' && location.pathname.startsWith('/app')

  // Logout in two steps: revoke in the API and go home; the local session closes once home is
  // on screen. Closing it first would make RequireAuth (still on /app) bounce to /login.
  async function signOut() {
    setSigningOut(true)
    await revokeSession()
    scheduleEndSession()
    await navigate('/', { replace: true })
    setSigningOut(false)
  }

  // Runs after every navigation is on screen (a new location object, even for the same path).
  useEffect(() => {
    if (!location.pathname.startsWith('/app') && takeScheduledEnd()) endSession()
  }, [location])

  return (
    <div className={css.page}>
      <a href="#main" data-skip-link="" className={css.skip}>{t('app.skipToContent')}</a>
      <div className={css.notices}>
        {!panelExplainsOffline && <OfflineBanner />}
        <UpdatePrompt />
        {notice && <p role="status" data-notice={notice} className={css.notice}>{t(`notices.${notice}`)}</p>}
      </div>

      <header className={css.header}>
        <div className={`${css.bar} glass`}>
          <Link to="/" className={css.brand}>
            <Logo />
            <span className={css.brandName}>{t('app.name')}</span>
          </Link>
          <nav aria-label={t('nav.main')} className={css.nav}>
            <ul>
              <li><NavLink to="/" end className={navClass}><Home size={16} aria-hidden="true" /><span className={css.label}>{t('nav.home')}</span></NavLink></li>
              <li><NavLink to="/news" className={navClass}><Newspaper size={16} aria-hidden="true" /><span className={css.label}>{t('nav.news')}</span></NavLink></li>
              <li><NavLink to="/nosotros" className={navClass}><Users size={16} aria-hidden="true" /><span className={css.label}>{t('nav.studio')}</span></NavLink></li>
              {signedIn ? (
                <>
                  <li><NavLink to="/app" className={navClass}><UserRound size={16} aria-hidden="true" /><span className={css.label}>{t('nav.myAccount')}</span></NavLink></li>
                  <li data-session-player={player?.username}>
                    <Button variant="ghost" size="s" loading={signingOut} onClick={() => void signOut()}>
                      <LogOut size={16} aria-hidden="true" />
                      <span className={css.label}>{t('nav.logout')}</span>
                    </Button>
                  </li>
                </>
              ) : (
                <>
                  <li><NavLink to="/login" className={navClass}><LogIn size={16} aria-hidden="true" /><span className={css.label}>{t('nav.login')}</span></NavLink></li>
                  <li>
                    <NavLink to="/register" className={({ isActive }) => `${css.cta} ${isActive ? css.ctaActive : ''}`}>
                      <UserRoundPlus size={16} aria-hidden="true" /><span className={css.ctaLabel}>{t('nav.register')}</span>
                    </NavLink>
                  </li>
                </>
              )}
            </ul>
          </nav>
          <ThemeToggle />
        </div>
      </header>

      <main id="main" tabIndex={-1} className={css.main}>
        <Outlet />
      </main>

      <SiteFooter />
      <ScrollRestoration />
    </div>
  )
}
