import { useTranslation } from 'react-i18next'
import { PendingPage } from '@/shared/ui/PageHeader'

export function LoginPage() {
  const { t } = useTranslation()
  return <PendingPage title={t('pages.login')} phase={3} />
}