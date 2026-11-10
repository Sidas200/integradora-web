import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/shared/ui/PageHeader'
import { EmptyState, ErrorState, Skeleton } from '@/shared/ui/states'
import { SaveSlotCard } from '../components/SaveSlotCard'
import { savesQuery } from '../queries'
import { SLOTS } from '../slots'

/** The three slots of the account: the ones with a save show their progress. */
export function SavesPage() {
  const { t } = useTranslation()
  const q = useQuery(savesQuery())

  return (
    <section>
      <PageHeader title={t('pages.saves')}>
        <p>{t('saves.intro')}</p>
      </PageHeader>

      {q.isPending && <Skeleton rows={3} />}
      {q.isError && <ErrorState error={q.error} onRetry={() => void q.refetch()} />}
      {q.isSuccess && q.data.length === 0 && <EmptyState title={t('saves.empty.title')} text={t('saves.empty.text')} />}
      {q.isSuccess && q.data.length > 0 && (
        <ul data-list="saves">
          {SLOTS.map((slot) => (
            <li key={slot}>
              <SaveSlotCard slot={slot} save={q.data.find((s) => s.slot === slot)} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}