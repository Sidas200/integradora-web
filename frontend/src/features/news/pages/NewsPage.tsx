import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/shared/ui/PageHeader'
import { NewsList } from '../components/NewsList'

export function NewsPage() {
  const { t } = useTranslation()
  return (
    <section>
      <PageHeader title={t('pages.news')} />
      <NewsList />
    </section>
  )
}