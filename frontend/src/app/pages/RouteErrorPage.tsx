import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
import { useTranslation } from 'react-i18next'
import { log } from '@/shared/lab/logger'
import { NotFoundPage } from './NotFoundPage'

/** Errors while rendering or loading a route (for example a lazy chunk that failed to download). */
export function RouteErrorPage() {
  const { t } = useTranslation()
  const error = useRouteError()

  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />
  log('error', 'Error de ruta', error)

  return (
    <main id="main">
      <h1>{t('routeError.title')}</h1>
      <p>{t('routeError.text')}</p>
      <Link to="/">{t('notFound.home')}</Link>
    </main>
  )
}