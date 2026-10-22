import { useTranslation } from 'react-i18next'
import { SubscribeForm } from '@/features/landing'
import { NewsList } from '@/features/news'
import { PwaStatus } from '@/shared/pwa'
import { PageHeader } from '@/shared/ui/PageHeader'

/**
 * The PWA lab on one screen: paginated list, form with Background Sync and the
 * Service Worker / Cache Storage / IndexedDB status. It is not linked from the menu.
 */
export function LabPage() {
  const { t } = useTranslation()
  return (
    <>
      <PageHeader title={t('pages.lab')} />
      <section aria-labelledby="lab-news-title">
        <h2 id="lab-news-title">{t('nav.news')}</h2>
        <NewsList />
      </section>
      <SubscribeForm />
      <PwaStatus />
    </>
  )
}