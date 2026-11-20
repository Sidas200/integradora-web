import '@testing-library/jest-dom/vitest'
// IndexedDB in memory for jsdom: the query cache is persisted there like in the browser (README §8.5).
import 'fake-indexeddb/auto'
import { cleanup, configure } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import '@/shared/i18n/i18n'
import { clearPersistedQueries } from '@/shared/query/persister'
import { server } from './msw/server'

// findBy*/waitFor wait up to 5 s (default 1 s). The first visit to a lazy route compiles its chunk
// (react-markdown and its plugins); on a slow disk (OneDrive on Windows) that alone can pass 1 s.
configure({ asyncUtilTimeout: 5000 })

// A request without a handler fails the test: every call must match the contract on purpose.
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(async () => {
  server.resetHandlers()
  cleanup() // without Vitest globals, Testing Library does not clean the DOM by itself
  // Each test starts without the saved session and the cached player data of the previous one.
  await clearPersistedQueries()
  localStorage.clear()
})
afterAll(() => server.close())

// jsdom does not implement scrolling; <ScrollRestoration /> calls it on every navigation.
window.scrollTo = () => {}