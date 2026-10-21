import { useSyncExternalStore } from 'react'
import type { MessageToPage } from './messages'

/**
 * PWA state shared by the UI. It does not import the Service Worker registration,
 * so the components that read it can be tested without vite-plugin-pwa.
 */
export interface PwaState {
  needRefresh: boolean
  offlineReady: boolean
  lastMessage: MessageToPage | null
}

let state: PwaState = { needRefresh: false, offlineReady: false, lastMessage: null }
const listeners = new Set<() => void>()
let updater: ((reload?: boolean) => Promise<void>) | undefined

export function setPwaState(patch: Partial<PwaState>): void {
  state = { ...state, ...patch }
  listeners.forEach((listener) => listener())
}

export function setUpdater(fn: (reload?: boolean) => Promise<void>): void {
  updater = fn
}

/** Activates the waiting Service Worker and reloads (only when the user asks). */
export const applyUpdate = (): void => void updater?.(true)

export function usePwaState(): PwaState {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => state,
  )
}