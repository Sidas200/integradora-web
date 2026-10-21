import { useTranslation } from 'react-i18next'
import { PendingPage } from '@/shared/ui/PageHeader'

export function SecurityPage() {
  const { t } = useTranslation()
  return <PendingPage title={t('pages.security')} phase={4} />
}