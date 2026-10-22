import { NavLink, Outlet, ScrollRestoration } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useSession } from '@/shared/auth'
import { OfflineBanner, UpdatePrompt } from '@/shared/pwa'

/** Frame of every page: skip link, main navigation, content and footer. */
export function PublicLayout() {
  const { t } = useTranslation()
  const { status } = useSession()

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
              <li><NavLink to="/app">{t('nav.myAccount')}</NavLink></li>
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