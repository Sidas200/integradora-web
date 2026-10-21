import { useTranslation } from 'react-i18next'
import { PendingPage } from '@/shared/ui/PageHeader'

export function HistoryPage() {
  const { t } = useTranslation()
  return <PendingPage title={t('pages.history')} phase={7} />
}