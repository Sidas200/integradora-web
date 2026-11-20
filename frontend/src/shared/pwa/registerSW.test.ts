import { renderHook } from '@testing-library/react'
import type { RegisterSWOptions } from 'vite-plugin-pwa/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { registerSW } from 'virtual:pwa-register'
import { applyUpdate, setPwaState, usePwaState } from './pwaState'
import { startPwa } from './registerSW'

vi.mock('virtual:pwa-register', () => ({ registerSW: vi.fn() }))

const updateSW = vi.fn(async () => {})
let options: RegisterSWOptions = {}
let worker: EventTarget

/** The options startPwa passed to vite-plugin-pwa, to fire its callbacks like the real registration would. */
function registered(): RegisterSWOptions {
  expect(registerSW).toHaveBeenCalledOnce()
  return options
}

/** What the components would read right now. */
const readState = () => renderHook(() => usePwaState()).result.current

beforeEach(() => {
  vi.mocked(registerSW).mockImplementation((given?: RegisterSWOptions) => {
    options = given ?? {}
    return updateSW
  })
  worker = new EventTarget()
  Object.defineProperty(window.navigator, 'serviceWorker', { value: worker, configurable: true })
})

afterEach(() => {
  vi.mocked(registerSW).mockReset()
  updateSW.mockClear()
  vi.useRealTimers()
  Reflect.deleteProperty(window.navigator, 'serviceWorker')
  setPwaState({ needRefresh: false, offlineReady: false, lastMessage: null })
})

describe('registro del Service Worker', () => {
  it('sin soporte de Service Worker no registra nada', () => {
    Reflect.deleteProperty(window.navigator, 'serviceWorker')
    startPwa()
    expect(registerSW).not.toHaveBeenCalled()
  })

  it('registra de inmediato', () => {
    startPwa()
    expect(registered().immediate).toBe(true)
  })

  it('busca una versión nueva cada hora (README §8.4)', () => {
    vi.useFakeTimers()
    const registration = { update: vi.fn(async () => undefined) } as unknown as ServiceWorkerRegistration
    startPwa()
    registered().onRegisteredSW?.('/sw.js', registration)

    vi.advanceTimersByTime(59 * 60 * 1000)
    expect(registration.update).not.toHaveBeenCalled()
    vi.advanceTimersByTime(60 * 1000)
    expect(registration.update).toHaveBeenCalledOnce()
  })

  it('precache completo y versión nueva quedan en el estado de la PWA', () => {
    startPwa()
    registered().onOfflineReady?.()
    registered().onNeedRefresh?.()

    expect(readState()).toMatchObject({ offlineReady: true, needRefresh: true })
  })

  it('"Actualizar" activa la versión que espera y recarga', () => {
    startPwa()
    applyUpdate()
    expect(updateSW).toHaveBeenCalledWith(true)
  })

  it('los mensajes del Service Worker llegan a la página', () => {
    startPwa()
    worker.dispatchEvent(Object.assign(new Event('message'), { data: { type: 'SUBSCRIPTION_SENT', count: 2 } }))

    expect(readState().lastMessage).toEqual({ type: 'SUBSCRIPTION_SENT', count: 2 })
  })

  it('un error al registrar no rompe la app', () => {
    startPwa()
    expect(() => registered().onRegisterError?.(new Error('no https'))).not.toThrow()
  })
})