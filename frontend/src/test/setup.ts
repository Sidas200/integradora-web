import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import '@/shared/i18n/i18n'
import { server } from './msw/server'

// A request without a handler fails the test: every call must match the contract on purpose.
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  server.resetHandlers()
  cleanup() // without Vitest globals, Testing Library does not clean the DOM by itself
})
afterAll(() => server.close())

// jsdom does not implement scrolling; <ScrollRestoration /> calls it on every navigation.
window.scrollTo = () => {}