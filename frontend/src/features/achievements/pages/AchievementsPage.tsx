import { useTranslation } from 'react-i18next'
import { PendingPage } from '@/shared/ui/PageHeader'

export function AchievementsPage() {
  const { t } = useTranslation()
  return <PendingPage title={t('pages.achievements')} phase={7} />
}