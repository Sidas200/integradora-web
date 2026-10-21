import { NavLink, Outlet } from 'react-router'
import { useTranslation } from 'react-i18next'

/** Player panel (/app/...): account navigation around the private screens. */
export function AppLayout() {
  const { t } = useTranslation()
  return (
    <>
      <nav aria-label={t('nav.app')}>
        <ul>
          <li><NavLink to="/app" end>{t('nav.dashboard')}</NavLink></li>
          <li><NavLink to="/app/saves">{t('nav.saves')}</NavLink></li>
          <li><NavLink to="/app/history">{t('nav.history')}</NavLink></li>
          <li><NavLink to="/app/achievements">{t('nav.achievements')}</NavLink></li>
          <li><NavLink to="/app/account">{t('nav.myAccount')}</NavLink></li>
        </ul>
      </nav>
      <Outlet />
    </>
  )
}