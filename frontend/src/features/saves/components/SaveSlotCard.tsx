import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { formatLongDate } from '@/shared/ui/formatDate'
import { useDuration } from '@/shared/ui/useDuration'
import type { SaveSummary } from '../queries'
import { ChapterLabel } from './ChapterLabel'

/** One slot of /app/saves. A slot without a save says how to fill it. */
export function SaveSlotCard({ slot, save }: { slot: number; save?: SaveSummary }) {
  const { t } = useTranslation()
  const duration = useDuration()

  if (!save) {
    return (
      <article data-slot={slot} data-empty="true">
        <h2>{t('saves.slot', { slot })}</h2>
        <p><strong>{t('saves.emptySlot.title')}</strong></p>
        <p>{t('saves.emptySlot.text')}</p>
      </article>
    )
  }

  return (
    <article data-slot={slot} data-empty="false">
      <h2>{t('saves.slot', { slot })}</h2>
      <p>
        {t(`saves.characters.${save.activeCharacter}`)} · <ChapterLabel chapter={save.currentChapter} />
      </p>
      <dl>
        <dt>{t('saves.lastMilestone')}</dt>
        <dd>{save.lastMilestone?.title ?? t('saves.noMilestone')}</dd>
        <dt>{t('saves.milestones')}</dt>
        <dd>{t('saves.milestonesValue', { completed: save.milestonesCompleted, total: save.milestonesTotal })}</dd>
        <dt>{t('saves.playTime')}</dt>
        <dd>{duration(save.playTimeSec)}</dd>
        <dt>{t('saves.updatedAt')}</dt>
        <dd><time dateTime={save.updatedAt}>{formatLongDate(save.updatedAt)}</time></dd>
      </dl>
      <Link to={`/app/saves/${slot}`}>{t('saves.open', { slot })}</Link>
    </article>
  )
}