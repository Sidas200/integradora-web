import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

/** Seconds of play → "3 h 12 min" or "28 min". Seconds are dropped: the game reports whole sessions. */
export function useDuration() {
  const { t } = useTranslation()
  return useCallback(
    (seconds: number) => {
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      return hours > 0 ? t('common.duration.hours', { hours, minutes }) : t('common.duration.minutes', { minutes })
    },
    [t],
  )
}