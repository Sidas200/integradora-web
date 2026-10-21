import { useTranslation } from 'react-i18next'
import { PendingPage } from '@/shared/ui/PageHeader'

export function RegisterPage() {
  const { t } = useTranslation()
  return <PendingPage title={t('pages.register')} phase={3} />
}