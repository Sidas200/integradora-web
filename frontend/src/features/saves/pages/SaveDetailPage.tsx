import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { toApiError } from '@/shared/api/problems'
import { formatLongDate } from '@/shared/ui/formatDate'
import { PageHeader } from '@/shared/ui/PageHeader'
import { EmptyState, ErrorState, Skeleton } from '@/shared/ui/states'
import { useDuration } from '@/shared/ui/useDuration'
import { ChapterLabel } from '../components/ChapterLabel'
import { SessionList } from '../components/SessionList'
import { saveDetailQuery } from '../queries'
import { parseSlot } from '../slots'

export function SaveDetailPage() {
  const { slot: param } = useParams()
  const slot = parseSlot(param)
  // A slot outside 1–3 never reaches the API: it is "not found" for the player.
  return slot === null ? <SaveNotFound /> : <SaveDetailView slot={slot} />
}

function SaveNotFound() {
  const { t } = useTranslation()
  return (
    <section>
      <PageHeader title={t('saves.notFound.title')} />
      <EmptyState
        title={t('saves.notFound.title')}
        text={t('saves.notFound.text')}
        action={<Link to="/app/saves">{t('saves.backToList')}</Link>}
      />
    </section>
  )
}

function SaveDetailView({ slot }: { slot: number }) {
  const { t } = useTranslation()
  const duration = useDuration()
  const q = useQuery(saveDetailQuery(slot))

  if (q.isPending) return <Skeleton rows={6} />
  if (q.isError) {
    if (toApiError(q.error).code === 'NOT_FOUND') return <SaveNotFound />
    return <ErrorState error={q.error} onRetry={() => void q.refetch()} />
  }

  const save = q.data
  const completed = save.milestones.filter((m) => m.completedAt).length

  return (
    <article>
      <PageHeader title={t('pages.saveDetail', { slot })}>
        <p>
          {t(`saves.characters.${save.activeCharacter}`)} · <ChapterLabel chapter={save.currentChapter} />
        </p>
        <p>
          <time dateTime={save.updatedAt}>{t('saves.savedOn', { date: formatLongDate(save.updatedAt) })}</time>
        </p>
      </PageHeader>

      <section aria-labelledby="save-stats">
        <h2 id="save-stats">{t('saves.stats.title')}</h2>
        <dl data-list="save-stats">
          <dt>{t('saves.playTime')}</dt>
          <dd>{duration(save.stats.playTimeSec)}</dd>
          <dt>{t('saves.stats.enemies')}</dt>
          <dd>{save.stats.enemiesDefeated}</dd>
          <dt>{t('saves.stats.deaths')}</dt>
          <dd>{save.stats.deaths}</dd>
          <dt>{t('saves.stats.materials')}</dt>
          <dd>{save.stats.materialsCollected}</dd>
          <dt>{t('saves.stats.crafted')}</dt>
          <dd>{save.stats.itemsCrafted}</dd>
        </dl>
      </section>

      <section aria-labelledby="save-story">
        <h2 id="save-story">{t('saves.story.title')}</h2>
        <p>{t('saves.story.progress', { completed, total: save.milestones.length })}</p>
        <ol data-list="milestones">
          {save.milestones.map((m) => (
            <li key={m.id} data-completed={Boolean(m.completedAt)}>
              <strong>{m.title}</strong> · <ChapterLabel chapter={m.chapter} />
              {' · '}
              {m.completedAt
                ? <time dateTime={m.completedAt}>{t('saves.story.completedOn', { date: formatLongDate(m.completedAt) })}</time>
                : t('saves.story.pending')}
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="save-inventory">
        <h2 id="save-inventory">{t('saves.inventory.title')}</h2>
        {save.inventory.length === 0 ? (
          <p>{t('saves.inventory.empty')}</p>
        ) : (
          <ul data-list="inventory">
            {save.inventory.map((item) => (
              <li key={item.itemId} data-item-id={item.itemId} data-icon={item.iconKey ?? undefined}>
                <strong>{item.name}</strong> × {item.quantity}
                {' · '}
                {t(`saves.inventory.types.${item.type}`)}
                {item.rarity && <> · {t(`saves.inventory.rarities.${item.rarity}`)}</>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="save-sessions">
        <h2 id="save-sessions">{t('saves.sessions.title')}</h2>
        <SessionList slot={slot} />
      </section>

      <footer>
        <Link to="/app/saves">{t('saves.backToList')}</Link>
      </footer>
    </article>
  )
}