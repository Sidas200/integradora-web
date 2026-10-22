import { useTranslation } from 'react-i18next'
import { PendingPage } from '@/shared/ui/PageHeader'

export function SavesPage() {
  const { t } = useTranslation()
  return <PendingPage title={t('pages.saves')} phase={7} />
}