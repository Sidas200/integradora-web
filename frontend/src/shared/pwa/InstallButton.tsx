import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui/Button'
import { promptInstall, useInstallKind } from './install'

/**
 * "Instalar app" (README §8.7). Chrome/Edge/Android open the browser's dialog; on iPhone and iPad the
 * button reveals the Share → Add to Home Screen steps. Hidden when installed or when the browser offers nothing.
 */
export function InstallButton() {
  const { t } = useTranslation()
  const kind = useInstallKind()
  const [showSteps, setShowSteps] = useState(false)
  const stepsId = useId()

  if (kind === 'installed' || kind === 'unavailable') return null

  if (kind === 'ios') {
    return (
      <div data-install="ios">
        <Button variant="outline" aria-expanded={showSteps} aria-controls={stepsId} onClick={() => setShowSteps((v) => !v)}>
          {t('install.button')}
        </Button>
        <p id={stepsId} hidden={!showSteps}>{t('install.iosSteps')}</p>
      </div>
    )
  }

  return (
    <div data-install="prompt">
      <Button variant="promise" onClick={() => void promptInstall()}>{t('install.button')}</Button>
    </div>
  )
}