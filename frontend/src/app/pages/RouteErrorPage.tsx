import { isRouteErrorResponse, useRouteError } from 'react-router'
import { useTranslation } from 'react-i18next'
import { log } from '@/shared/lab/logger'
import { LostScreen } from './LostScreen'
import { NotFoundPage } from './NotFoundPage'
import css from './pages.module.css'

/** Errors while rendering or loading a route (for example a lazy chunk that failed to download). */
export function RouteErrorPage() {
  const { t } = useTranslation()
  const error = useRouteError()

  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />
  log('error', 'Error de ruta', error)

  return (
    <main id="main">
      <LostScreen full code="!?" heading={<h1 className={css.title}>{t('routeError.title')}</h1>} text={t('routeError.text')} />
    </main>
  )
}
