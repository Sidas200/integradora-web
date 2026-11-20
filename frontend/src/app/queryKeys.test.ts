import { describe, expect, it } from 'vitest'
import { accountKeys } from '@/features/account'
import { achievementsKeys } from '@/features/achievements'
import { historyKeys } from '@/features/history'
import { savesKeys } from '@/features/saves'

/**
 * Logout removes every query whose key starts with 'account' (AuthProvider). If a private list
 * used another root, the next player on the same browser would see the previous one's data.
 */
describe('claves de las consultas privadas', () => {
  it.each([
    ['perfil', accountKeys.profile],
    ['configuración', accountKeys.settings],
    ['dispositivos', accountKeys.devices],
    ['partidas', savesKeys.list],
    ['detalle de partida', savesKeys.detail(1)],
    ['sesiones de una partida', savesKeys.sessions(1)],
    ['historial', historyKeys.list()],
    ['historial filtrado', historyKeys.list('SESSION')],
    ['actividad reciente', historyKeys.recent(5)],
    ['logros del jugador', achievementsKeys.mine],
  ])('%s cuelga de "account"', (_, key) => {
    expect(key[0]).toBe('account')
  })

  it('el catálogo público de logros no se borra al cerrar sesión', () => {
    expect(achievementsKeys.catalog[0]).not.toBe('account')
  })

  it('el historial filtrado y la actividad reciente no comparten caché', () => {
    expect(historyKeys.list()).not.toEqual(historyKeys.recent(5))
    expect(historyKeys.list('SESSION')).not.toEqual(historyKeys.list('MILESTONE'))
  })
})