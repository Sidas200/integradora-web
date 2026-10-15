import { useSyncExternalStore } from 'react'
import { registerSW } from 'virtual:pwa-register'
import type { MessageToPage } from './messages'
import { log } from '../lab/logger'

type PwaState = { needRefresh: boolean; offlineReady: boolean; lastMessage: MessageToPage | null }

let state: PwaState = { needRefresh: false, offlineReady: false, lastMessage: null }
const listeners = new Set<() => void>()
const set = (patch: Partial<PwaState>) => {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}

let updateSW: ((reload?: boolean) => Promise<void>) | undefined

export function startPwa(): void {
  if (!('serviceWorker' in navigator)) {
    log('pwa', 'Este navegador no soporta Service Workers')
    return
  }
  updateSW = registerSW({
    immediate: true,
    onRegisteredSW(url, registration) {
      log('pwa', `Service Worker registrado: ${url}`, registration)
      if (registration) setInterval(() => void registration.update(), 60 * 60 * 1000)
    },
    onOfflineReady() {
      log('pwa', 'App lista para usarse sin conexión (precache completo)')
      set({ offlineReady: true })
    },
    onNeedRefresh() {
      log('pwa', 'Hay una versión nueva esperando')
      set({ needRefresh: true })
    },
    onRegisterError(error) {
      log('error', 'No se pudo registrar el Service Worker', error)
    },
  })

  navigator.serviceWorker.addEventListener('message', (event: MessageEvent<MessageToPage>) => {
    log('pwa', `Mensaje del Service Worker: ${event.data.type}`, event.data)
    set({ lastMessage: event.data })
  })
}

export const applyUpdate = () => void updateSW?.(true)

export function usePwaState(): PwaState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
  )
}
