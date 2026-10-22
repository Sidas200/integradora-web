import { useTranslation } from 'react-i18next'
import { PendingPage } from '@/shared/ui/PageHeader'

export function DashboardPage() {
  const { t } = useTranslation()
  return <PendingPage title={t('pages.dashboard')} phase={7} />
}