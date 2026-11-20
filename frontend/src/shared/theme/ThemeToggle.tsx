import { Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { setTheme, useTheme } from './theme'
import css from './ThemeToggle.module.css'

/** Moon/sun button of the header (Ananya-style). Switches between the pastel and the dark theme. */
export function ThemeToggle() {
  const { t } = useTranslation()
  const theme = useTheme()
  const next = theme === 'dark' ? 'light' : 'dark'
  return (
    <button
      type="button"
      className={css.toggle}
      onClick={() => setTheme(next)}
      aria-label={t(next === 'dark' ? 'theme.toDark' : 'theme.toLight')}
      title={t(next === 'dark' ? 'theme.toDark' : 'theme.toLight')}
    >
      <span className={css.icon} data-theme-icon={theme} aria-hidden="true">
        {theme === 'dark' ? <Sun size={18} strokeWidth={2.2} /> : <Moon size={18} strokeWidth={2.2} />}
      </span>
    </button>
  )
}
