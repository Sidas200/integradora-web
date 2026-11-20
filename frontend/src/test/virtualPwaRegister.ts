import type { RegisterSWOptions } from 'vite-plugin-pwa/types'

/**
 * Stand-in for `virtual:pwa-register`, a module that only exists when vite-plugin-pwa runs.
 * vitest.config.ts points that import here, so registerSW.ts can be loaded (and mocked) in tests.
 */
export function registerSW(_options: RegisterSWOptions = {}): (reloadPage?: boolean) => Promise<void> {
  return async () => {}
}