import { useSyncExternalStore } from 'react'
import { log } from '@/shared/lab/logger'

/** Chromium's install event (not in lib.dom yet). */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * prompt: Chrome, Edge or Android offered the install (beforeinstallprompt).
 * ios: Safari on iPhone/iPad, which has no install event: the button explains Share → Add to Home Screen.
 * installed: running as the installed app, or just installed. unavailable: nothing to offer.
 */
export type InstallKind = 'prompt' | 'ios' | 'installed' | 'unavailable'

let deferred: BeforeInstallPromptEvent | null = null
let installed = false
let listening = false
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((listener) => listener())

function isStandalone(): boolean {
  const standaloneMedia = typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true
  return standaloneMedia || iosStandalone
}

function isIos(): boolean {
  // iPadOS 13+ says it is a Mac; touch points give it away.
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && (navigator.maxTouchPoints ?? 0) > 1)
}

/**
 * Called once from main.tsx, before React renders: Chromium fires beforeinstallprompt early and
 * only once per page load, so it is kept until the player presses "Instalar app".
 */
export function listenForInstall(): void {
  if (listening) return
  listening = true
  installed = isStandalone()
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault() // no mini-infobar: the app shows its own button
    deferred = event as BeforeInstallPromptEvent
    log('pwa', 'El navegador ofrece instalar la app')
    emit()
  })
  window.addEventListener('appinstalled', () => {
    installed = true
    deferred = null
    log('pwa', 'App instalada')
    emit()
  })
}

export function getInstallKind(): InstallKind {
  if (installed || isStandalone()) return 'installed'
  if (deferred) return 'prompt'
  return isIos() ? 'ios' : 'unavailable'
}

/** Shows the browser's install dialog. The event works once: afterwards the button hides until the browser offers it again. */
export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  const event = deferred
  if (!event) return 'unavailable'
  deferred = null
  await event.prompt()
  const { outcome } = await event.userChoice
  log('pwa', `Instalación: ${outcome === 'accepted' ? 'aceptada' : 'cancelada'}`)
  emit()
  return outcome
}

export function useInstallKind(): InstallKind {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getInstallKind,
  )
}

/** Only for the tests: back to a page that has not received any event. */
export function resetInstallForTests(): void {
  deferred = null
  installed = false
  emit()
}