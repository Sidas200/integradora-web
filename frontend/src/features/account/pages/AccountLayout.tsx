import { NavLink, Outlet } from 'react-router'
import { useTranslation } from 'react-i18next'

/** Sub-navigation shared by the account screens. */
export function AccountLayout() {
  const { t } = useTranslation()
  return (
    <>
      <nav aria-label={t('nav.account')}>
        <ul>
          <li><NavLink to="/app/account" end>{t('nav.profile')}</NavLink></li>
          <li><NavLink to="/app/account/settings">{t('nav.settings')}</NavLink></li>
          <li><NavLink to="/app/account/security">{t('nav.security')}</NavLink></li>
          <li><NavLink to="/app/account/delete">{t('nav.deleteAccount')}</NavLink></li>
        </ul>
      </nav>
      <Outlet />
    </>
  )
}