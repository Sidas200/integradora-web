import { describe, expect, it } from 'vitest'
import { clearOfflineSession, readOfflineSession, saveOfflineSession } from './offlineSession'

const KEY = 'tdimp.offline-session'
const felc = { id: '6f1c2a7e-0b7d-4e7a-9a0e-3d1f5b2c9e11', username: 'Felc', email: 'felc@example.com' }

describe('sesión guardada para el modo lectura', () => {
  it('guarda solo id, nombre y correo, nunca un token', () => {
    saveOfflineSession({ ...felc, accessToken: 'secret' } as typeof felc)

    expect(JSON.parse(localStorage.getItem(KEY) ?? '')).toEqual(felc)
    expect(readOfflineSession()).toEqual(felc)
  })

  it('se borra al cerrar sesión', () => {
    saveOfflineSession(felc)
    clearOfflineSession()

    expect(readOfflineSession()).toBeNull()
    expect(localStorage.getItem(KEY)).toBeNull()
  })

  it.each([
    ['texto que no es JSON', '{no-json'],
    ['un valor que no es objeto', '"Felc"'],
    ['sin correo', JSON.stringify({ id: '1', username: 'Felc' })],
    ['con tipos equivocados', JSON.stringify({ id: 1, username: 'Felc', email: 'felc@example.com' })],
  ])('ignora %s', (_, raw) => {
    localStorage.setItem(KEY, raw)
    expect(readOfflineSession()).toBeNull()
  })
})