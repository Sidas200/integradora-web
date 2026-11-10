import { useTranslation } from 'react-i18next'

/** Chapter 0 is the prologue (the game starts there before the first zone). */
export function ChapterLabel({ chapter }: { chapter: number }) {
  const { t } = useTranslation()
  return <>{chapter === 0 ? t('saves.prologue') : t('saves.chapter', { chapter })}</>
}