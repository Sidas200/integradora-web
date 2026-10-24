import { registerSW } from 'virtual:pwa-register'
import type { MessageToPage } from './messages'
import { setPwaState, setUpdater } from './pwaState'
import { log } from '@/shared/lab/logger'

/** Registers the Service Worker. Only main.tsx calls it. */
export function startPwa(): void {
  if (!('serviceWorker' in navigator)) {
    log('pwa', 'Este navegador no soporta Service Workers')
    return
  }
  setUpdater(registerSW({
    immediate: true,
    onRegisteredSW(url, registration) {
      log('pwa', `Service Worker registrado: ${url}`, registration)
      if (registration) setInterval(() => void registration.update(), 60 * 60 * 1000) // README §8.4
    },
    onOfflineReady() {
      log('pwa', 'App lista para usarse sin conexión (precache completo)')
      setPwaState({ offlineReady: true })
    },
    onNeedRefresh() {
      log('pwa', 'Hay una versión nueva esperando')
      setPwaState({ needRefresh: true })
    },
    onRegisterError(error) {
      log('error', 'No se pudo registrar el Service Worker', error)
    },
  }))

  navigator.serviceWorker.addEventListener('message', (event: MessageEvent<MessageToPage>) => {
    log('pwa', `Mensaje del Service Worker: ${event.data.type}`, event.data)
    setPwaState({ lastMessage: event.data })
  })
}