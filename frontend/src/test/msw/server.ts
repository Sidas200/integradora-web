import { setupServer } from 'msw/node'
import { handlers } from './handlers'

/** Fake API for Vitest: intercepts fetch, no backend needed. */
export const server = setupServer(...handlers)