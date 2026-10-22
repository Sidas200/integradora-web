import { useTranslation } from 'react-i18next'
import { PendingPage } from '@/shared/ui/PageHeader'

export function SettingsPage() {
  const { t } = useTranslation()
  return <PendingPage title={t('pages.settings')} phase={4} />
}