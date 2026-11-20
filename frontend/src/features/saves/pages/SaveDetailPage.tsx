import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Backpack, BarChart3, Check, Circle, Clock, Gamepad2, Hammer, Leaf, Skull, Swords } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { toApiError } from '@/shared/api/problems'
import { formatLongDate } from '@/shared/ui/formatDate'
import { PageHeader } from '@/shared/ui/PageHeader'
import { SkyScene } from '@/shared/ui/SkyScene'
import { EmptyState, ErrorState, Skeleton } from '@/shared/ui/states'
import { useDuration } from '@/shared/ui/useDuration'
import { ChapterLabel } from '../components/ChapterLabel'
import { SessionList } from '../components/SessionList'
import { saveDetailQuery } from '../queries'
import { parseSlot } from '../slots'
import css from '../saves.module.css'

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

  if (q.data === undefined) {
    if (!q.isError) return <Skeleton rows={6} />
    if (toApiError(q.error).code === 'NOT_FOUND') return <SaveNotFound />
    return <ErrorState error={q.error} onRetry={() => void q.refetch()} />
  }

  const save = q.data
  const completed = save.milestones.filter((m) => m.completedAt).length

  return (
    <article>
      <div className={css.banner} aria-hidden="true"><SkyScene variant="card" petals={8} /></div>
      <PageHeader title={t('pages.saveDetail', { slot })}>
        <p>
          {t(`saves.characters.${save.activeCharacter}`)} · <ChapterLabel chapter={save.currentChapter} />
        </p>
        <p>
          <time dateTime={save.updatedAt}>{t('saves.savedOn', { date: formatLongDate(save.updatedAt) })}</time>
        </p>
      </PageHeader>

      <div className={css.widgets}>
      <section aria-labelledby="save-stats" className={`${css.widget} ${css.statsWidget}`}>
        <h2 id="save-stats" className={css.widgetTitle}><BarChart3 size={18} aria-hidden="true" />{t('saves.stats.title')}</h2>
        <dl data-list="save-stats" className={css.stats}>
          <div><dt><Clock size={14} aria-hidden="true" />{t('saves.playTime')}</dt><dd>{duration(save.stats.playTimeSec)}</dd></div>
          <div><dt><Swords size={14} aria-hidden="true" />{t('saves.stats.enemies')}</dt><dd>{save.stats.enemiesDefeated}</dd></div>
          <div><dt><Skull size={14} aria-hidden="true" />{t('saves.stats.deaths')}</dt><dd>{save.stats.deaths}</dd></div>
          <div><dt><Leaf size={14} aria-hidden="true" />{t('saves.stats.materials')}</dt><dd>{save.stats.materialsCollected}</dd></div>
          <div><dt><Hammer size={14} aria-hidden="true" />{t('saves.stats.crafted')}</dt><dd>{save.stats.itemsCrafted}</dd></div>
        </dl>
      </section>

      <section aria-labelledby="save-story" className={css.widget}>
        <h2 id="save-story" className={css.widgetTitle}><Gamepad2 size={18} aria-hidden="true" />{t('saves.story.title')}</h2>
        <p className={css.goal}>
          <span className={css.goalBig} aria-hidden="true">{completed}<small>/{save.milestones.length}</small></span>
          {t('saves.story.progress', { completed, total: save.milestones.length })}
        </p>
        <ol data-list="milestones" className={css.milestones}>
          {save.milestones.map((m) => (
            <li key={m.id} data-completed={Boolean(m.completedAt)}>
              <span className={css.check} aria-hidden="true">{m.completedAt ? <Check size={14} strokeWidth={3} /> : <Circle size={10} />}</span>
              <strong>{m.title}</strong> · <ChapterLabel chapter={m.chapter} />
              {' · '}
              {m.completedAt
                ? <time dateTime={m.completedAt}>{t('saves.story.completedOn', { date: formatLongDate(m.completedAt) })}</time>
                : t('saves.story.pending')}
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="save-inventory" className={css.widget}>
        <h2 id="save-inventory" className={css.widgetTitle}><Backpack size={18} aria-hidden="true" />{t('saves.inventory.title')}</h2>
        {save.inventory.length === 0 ? (
          <p className={css.muted}>{t('saves.inventory.empty')}</p>
        ) : (
          <ul data-list="inventory" className={css.inventory}>
            {save.inventory.map((item) => (
              <li key={item.itemId} data-item-id={item.itemId} data-icon={item.iconKey ?? undefined} data-rarity={item.rarity ?? 'COMMON'}>
                <span className={css.itemIcon} aria-hidden="true">{item.name.slice(0, 1)}</span>
                <strong>{item.name}</strong> × {item.quantity}
                {' · '}
                {t(`saves.inventory.types.${item.type}`)}
                {item.rarity && <> · {t(`saves.inventory.rarities.${item.rarity}`)}</>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="save-sessions" className={`${css.widget} ${css.wide}`}>
        <h2 id="save-sessions" className={css.widgetTitle}><Clock size={18} aria-hidden="true" />{t('saves.sessions.title')}</h2>
        <SessionList slot={slot} />
      </section>
      </div>

      <footer className={css.back}>
        <Link to="/app/saves"><ArrowLeft size={16} aria-hidden="true" />{t('saves.backToList')}</Link>
      </footer>
    </article>
  )
}