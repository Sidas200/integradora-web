import { ShieldCheck, SlidersHorizontal, Trash2, UserRound } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'
import { useTranslation } from 'react-i18next'
import css from '../account.module.css'

const LINKS = [
  { to: '/app/account', label: 'nav.profile', Icon: UserRound, end: true },
  { to: '/app/account/settings', label: 'nav.settings', Icon: SlidersHorizontal },
  { to: '/app/account/security', label: 'nav.security', Icon: ShieldCheck },
  { to: '/app/account/delete', label: 'nav.deleteAccount', Icon: Trash2, danger: true },
] as const

/** Sub-navigation shared by the account screens: a glass pill of tabs (Study Together). */
export function AccountLayout() {
  const { t } = useTranslation()
  return (
    <>
      <nav aria-label={t('nav.account')} className={css.subnav}>
        <ul>
          {LINKS.map(({ to, label, Icon, ...rest }) => (
            <li key={to}>
              <NavLink to={to} end={'end' in rest} data-danger={'danger' in rest || undefined}>
                <Icon size={16} aria-hidden="true" />
                <span>{t(label)}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <Outlet />
    </>
  )
}
