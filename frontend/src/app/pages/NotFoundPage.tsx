import { useTranslation } from 'react-i18next'
import { LostScreen } from './LostScreen'
import css from './pages.module.css'

export function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <section className="container">
      <LostScreen code="404" heading={<h1 className={css.title}>{t('notFound.title')}</h1>} text={t('notFound.text')} />
    </section>
  )
}
