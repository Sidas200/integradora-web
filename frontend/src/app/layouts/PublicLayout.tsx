import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, ScrollRestoration, useLocation, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { endSession, revokeSession, useSession } from '@/shared/auth'
import { OfflineBanner, UpdatePrompt } from '@/shared/pwa'
import { Button } from '@/shared/ui/Button'

/** Frame of every page: skip link, main navigation, content and footer. */
export function PublicLayout() {
  const { t } = useTranslation()
  const { status, player } = useSession()
  const navigate = useNavigate()
  const location = useLocation()
  const [signingOut, setSigningOut] = useState(false)
  const endAfterNavigation = useRef(false)

  // Logout in two steps: revoke in the API and go home; the local session closes once home is
  // on screen. Closing it first would make RequireAuth (still on /app) bounce to /login.
  async function signOut() {
    setSigningOut(true)
    await revokeSession()
    endAfterNavigation.current = true
    await navigate('/', { replace: true })
    setSigningOut(false)
  }

  // Runs after every navigation is on screen (a new location object, even for the same path).
  useEffect(() => {
    if (endAfterNavigation.current && location.pathname === '/') {
      endAfterNavigation.current = false
      endSession()
    }
  }, [location])

  return (
    <>
      <a href="#main" data-skip-link="">{t('app.skipToContent')}</a>
      <OfflineBanner />
      <UpdatePrompt />
      <header>
        <NavLink to="/" end>{t('app.name')}</NavLink>
        <nav aria-label={t('nav.main')}>
          <ul>
            <li><NavLink to="/" end>{t('nav.home')}</NavLink></li>
            <li><NavLink to="/news">{t('nav.news')}</NavLink></li>
            {status === 'authenticated' ? (
              <>
                <li><NavLink to="/app">{t('nav.myAccount')}</NavLink></li>
                <li data-session-player={player?.username}>
                  <Button variant="outline" loading={signingOut} onClick={() => void signOut()}>
                    {t('nav.logout')}
                  </Button>
                </li>
              </>
            ) : (
              <>
                <li><NavLink to="/login">{t('nav.login')}</NavLink></li>
                <li><NavLink to="/register">{t('nav.register')}</NavLink></li>
              </>
            )}
          </ul>
        </nav>
      </header>
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <footer>
        <p>Hex Studio · Universidad Tecnológica de Chihuahua</p>
      </footer>
      <ScrollRestoration />
    </>
  )
}