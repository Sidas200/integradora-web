import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/shared/ui/PageHeader'

export function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <section>
      <PageHeader title={t('notFound.title')} />
      <p>{t('notFound.text')}</p>
      <Link to="/">{t('notFound.home')}</Link>
    </section>
  )
}