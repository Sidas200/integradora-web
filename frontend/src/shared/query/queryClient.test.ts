import { describe, expect, it } from 'vitest'
import { ApiError } from '@/shared/api/problems'
import { createQueryClient } from './queryClient'

const defaults = () => createQueryClient().getDefaultOptions()
const retry = (failureCount: number, error: unknown) => {
  const policy = defaults().queries?.retry
  if (typeof policy !== 'function') throw new Error('retry must be a function')
  return policy(failureCount, error as Error)
}

describe('política de reintentos', () => {
  it.each([400, 401, 403, 404, 409, 429])('un %i no se reintenta: repetir no lo cambia', (status) => {
    expect(retry(0, new ApiError('VALIDATION_FAILED', status, null))).toBe(false)
  })

  it('un 5xx se reintenta una sola vez', () => {
    const error = new ApiError('INTERNAL_ERROR', 503, null)
    expect(retry(0, error)).toBe(true)
    expect(retry(1, error)).toBe(false)
  })

  it('sin red (sin status) también se reintenta una vez', () => {
    const error = new ApiError('NETWORK_ERROR', null, null)
    expect(retry(0, error)).toBe(true)
    expect(retry(1, error)).toBe(false)
  })

  it('un error que no es de la API se reintenta una vez', () => {
    expect(retry(0, new Error('boom'))).toBe(true)
    expect(retry(1, new Error('boom'))).toBe(false)
  })

  it('las mutaciones nunca se reintentan solas (podrían duplicar una escritura)', () => {
    expect(defaults().mutations?.retry).toBe(false)
  })
})

describe('red y frescura', () => {
  it('primero pregunta a la red aunque el navegador diga que no hay, para que el Service Worker responda', () => {
    expect(defaults().queries?.networkMode).toBe('offlineFirst')
  })

  it('los datos se consideran frescos un minuto y se refrescan al volver la red o el foco', () => {
    const queries = defaults().queries
    expect(queries?.staleTime).toBe(60_000)
    expect(queries?.refetchOnReconnect).toBe(true)
    expect(queries?.refetchOnWindowFocus).toBe(true)
  })

  it('cada llamada crea un cliente nuevo (las pruebas no comparten caché)', () => {
    expect(createQueryClient()).not.toBe(createQueryClient())
  })
})