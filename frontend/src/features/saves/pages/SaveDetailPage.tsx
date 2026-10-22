import { useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { PendingPage } from '@/shared/ui/PageHeader'

export function SaveDetailPage() {
  const { t } = useTranslation()
  const { slot } = useParams()
  return <PendingPage title={t('pages.saveDetail', { slot })} phase={7} />
}