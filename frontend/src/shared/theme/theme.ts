import { useSyncExternalStore } from 'react'

/**
 * light (pastel) is the default design; dark is the navy/neon theme. "system" follows the device.
 * The choice is kept in localStorage and applied as data-theme on <html> before React renders.
 */
export type ThemeChoice = 'light' | 'dark' | 'system'
export type Theme = 'light' | 'dark'

const KEY = 'tdimp.theme'
const listeners = new Set<() => void>()
let choice: ThemeChoice = readChoice()

function readChoice(): ThemeChoice {
  try {
    const saved = globalThis.localStorage?.getItem(KEY)
    return saved === 'light' || saved === 'dark' ? saved : 'system'
  } catch {
    return 'system'
  }
}

const darkQuery = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null

export function resolvedTheme(): Theme {
  if (choice !== 'system') return choice
  return darkQuery()?.matches ? 'dark' : 'light'
}

function apply() {
  const theme = resolvedTheme()
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#10182B' : '#F6EEF6')
  listeners.forEach((listener) => listener())
}

/** Called once from main.tsx: applies the saved theme and follows the device while on "system". */
export function startTheme(): void {
  apply()
  darkQuery()?.addEventListener('change', () => {
    if (choice === 'system') apply()
  })
}

export function setTheme(next: ThemeChoice): void {
  choice = next
  try {
    if (next === 'system') globalThis.localStorage?.removeItem(KEY)
    else globalThis.localStorage?.setItem(KEY, next)
  } catch {
    // storage blocked: the theme still changes for this visit
  }
  apply()
}

export const getThemeChoice = () => choice

export function useTheme(): Theme {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    resolvedTheme,
  )
}
