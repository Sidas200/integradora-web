import { useTranslation } from 'react-i18next'
import { PendingPage } from '@/shared/ui/PageHeader'

export function DeleteAccountPage() {
  const { t } = useTranslation()
  return <PendingPage title={t('pages.deleteAccount')} phase={4} />
}