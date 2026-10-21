import { useTranslation } from 'react-i18next'
import { PendingPage } from '@/shared/ui/PageHeader'

export function ProfilePage() {
  const { t } = useTranslation()
  return <PendingPage title={t('pages.profile')} phase={4} />
}