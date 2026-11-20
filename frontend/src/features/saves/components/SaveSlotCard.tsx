import { Clock, Flag, Play, Plus } from 'lucide-react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Chip } from '@/shared/ui/Chip'
import { formatLongDate } from '@/shared/ui/formatDate'
import { SkyScene } from '@/shared/ui/SkyScene'
import { useDuration } from '@/shared/ui/useDuration'
import type { SaveSummary } from '../queries'
import { ChapterLabel } from './ChapterLabel'
import css from '../saves.module.css'

/** One slot of /app/saves as a poster card (Flix). A slot without a save says how to fill it. */
export function SaveSlotCard({ slot, save }: { slot: number; save?: SaveSummary }) {
  const { t } = useTranslation()
  const duration = useDuration()

  if (!save) {
    return (
      <article data-slot={slot} data-empty="true" className={`${css.slot} ${css.slotEmpty}`}>
        <span className={css.emptyIcon} aria-hidden="true"><Plus size={28} /></span>
        <h2>{t('saves.slot', { slot })}</h2>
        <p><strong>{t('saves.emptySlot.title')}</strong></p>
        <p>{t('saves.emptySlot.text')}</p>
      </article>
    )
  }

  const progress = save.milestonesTotal ? Math.round((save.milestonesCompleted / save.milestonesTotal) * 100) : 0
  return (
    <article data-slot={slot} data-empty="false" className={css.slot}>
      <div className={css.poster}>
        <SkyScene variant="card" petals={5} />
        <span className={css.slotNumber} aria-hidden="true">{String(slot).padStart(2, '0')}</span>
      </div>
      <div className={css.slotBody}>
        <p className="visually-hidden">
          {t(`saves.characters.${save.activeCharacter}`)} · <ChapterLabel chapter={save.currentChapter} />
        </p>
        <div className={css.chips} aria-hidden="true">
          <Chip tone="promise">{t(`saves.characters.${save.activeCharacter}`)}</Chip>
          <Chip tone="primary"><ChapterLabel chapter={save.currentChapter} /></Chip>
        </div>
        <h2>{t('saves.slot', { slot })}</h2>
        <dl className={css.facts}>
          <div><dt><Flag size={14} aria-hidden="true" />{t('saves.lastMilestone')}</dt><dd>{save.lastMilestone?.title ?? t('saves.noMilestone')}</dd></div>
          <div><dt>{t('saves.milestones')}</dt><dd>{t('saves.milestonesValue', { completed: save.milestonesCompleted, total: save.milestonesTotal })}</dd></div>
          <div><dt><Clock size={14} aria-hidden="true" />{t('saves.playTime')}</dt><dd className={css.hud}>{duration(save.playTimeSec)}</dd></div>
          <div><dt>{t('saves.updatedAt')}</dt><dd><time dateTime={save.updatedAt}>{formatLongDate(save.updatedAt)}</time></dd></div>
        </dl>
        <div className={css.progress} aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>
        <Link to={`/app/saves/${slot}`} className={css.open}>
          <span>{t('saves.open', { slot })}</span>
          <span className={css.play} aria-hidden="true"><Play size={16} fill="currentColor" /></span>
        </Link>
      </div>
    </article>
  )
}
