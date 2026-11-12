import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/shared/api/problems'
import { tokenFixture } from '@/test/msw/fixtures'
import { problem, url } from '@/test/msw/handlers'
import { server } from '@/test/msw/server'
import { readOfflineSession } from './offlineSession'
import {
  endSession, getAccessToken, getSession, login, logout, reauthenticate, refreshSession, register, restoreSession,
  scheduleEndSession, subscribeSession, takeScheduledEnd, updateSessionPlayer,
} from './session'

const felc = tokenFixture().player

/** Counts the calls to POST /auth/refresh and answers each with a new access token. */
function countRefreshes(answer: (n: number) => Response = (n) => HttpResponse.json(tokenFixture(`access-r${n}`))) {
  const calls = { count: 0 }
  server.use(http.post(url('/auth/refresh'), () => answer(++calls.count)))
  return calls
}

afterEach(() => {
  vi.useRealTimers()
  endSession()
})

describe('iniciar y cerrar sesión', () => {
  it('login abre la sesión web y guarda quién es para el modo lectura', async () => {
    const bodies: unknown[] = []
    server.use(http.post(url('/auth/login'), async ({ request }) => {
      bodies.push(await request.json())
      return HttpResponse.json(tokenFixture('access-login'))
    }))

    expect(await login({ email: 'felc@example.com', password: 'a-long-passphrase' })).toEqual(felc)

    expect(bodies).toEqual([{ email: 'felc@example.com', password: 'a-long-passphrase', client: 'WEB' }])
    expect(getSession()).toEqual({ status: 'authenticated', player: felc })
    expect(await getAccessToken()).toBe('access-login')
    expect(readOfflineSession()).toEqual(felc)
  })

  it('credenciales incorrectas no abren sesión', async () => {
    server.use(http.post(url('/auth/login'), () => problem(401, 'INVALID_CREDENTIALS')))

    await expect(login({ email: 'felc@example.com', password: 'wrong' })).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' })
    expect(getSession().status).not.toBe('authenticated')
  })

  it('registro también abre la sesión como cliente WEB', async () => {
    let client: unknown
    server.use(http.post(url('/auth/register'), async ({ request }) => {
      client = ((await request.json()) as { client: string }).client
      return HttpResponse.json(tokenFixture(), { status: 201 })
    }))

    await register({ email: 'felc@example.com', username: 'Felc', password: 'a-long-passphrase', acceptedPrivacyNotice: true })
    expect(client).toBe('WEB')
    expect(getSession().status).toBe('authenticated')
  })

  it('logout revoca en la API con el encabezado anti-CSRF y cierra la sesión local', async () => {
    await login({ email: 'felc@example.com', password: 'a-long-passphrase' })
    const headers: (string | null)[] = []
    server.use(http.post(url('/auth/logout'), ({ request }) => {
      headers.push(request.headers.get('X-Requested-With'))
      return new HttpResponse(null, { status: 204 })
    }))

    await logout()

    expect(headers).toEqual(['tdimp-pwa'])
    expect(getSession()).toEqual({ status: 'anonymous', player: null })
    expect(await getAccessToken()).toBeNull()
    expect(readOfflineSession()).toBeNull()
  })

  it('sin red el logout cierra igual la sesión en este navegador', async () => {
    await login({ email: 'felc@example.com', password: 'a-long-passphrase' })
    server.use(http.post(url('/auth/logout'), () => HttpResponse.error()))

    await logout()
    expect(getSession().status).toBe('anonymous')
  })
})

describe('renovación del token', () => {
  it('al abrir la app la cookie de refresh restaura la sesión', async () => {
    countRefreshes()
    const states: string[] = []
    const unsubscribe = subscribeSession(() => states.push(getSession().status))

    expect(await restoreSession()).toBe(true)
    unsubscribe()

    expect(states).toEqual(['loading', 'authenticated'])
  })

  it('varias peticiones a la vez comparten UNA renovación (dos rotaciones revocarían la sesión)', async () => {
    const calls = countRefreshes()
    await restoreSession()
    calls.count = 0
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(Date.now() + 15 * 60 * 1000) // the 900 s token expired

    const tokens = await Promise.all([getAccessToken(), getAccessToken(), getAccessToken()])

    expect(calls.count).toBe(1)
    expect(new Set(tokens)).toEqual(new Set(['access-r1']))
  })

  it('renueva 30 s antes de que venza, no después', async () => {
    const calls = countRefreshes()
    await restoreSession()
    vi.useFakeTimers({ toFake: ['Date'] })
    const start = Date.now()

    vi.setSystemTime(start + (900 - 31) * 1000)
    expect(await getAccessToken()).toBe('access-r1')
    vi.setSystemTime(start + (900 - 29) * 1000)
    expect(await getAccessToken()).toBe('access-r2')
    expect(calls.count).toBe(2)
  })

  it('un refresh rechazado (401) cierra la sesión', async () => {
    await login({ email: 'felc@example.com', password: 'a-long-passphrase' })
    countRefreshes(() => problem(401, 'INVALID_SESSION'))

    expect(await refreshSession()).toBe(false)
    expect(getSession().status).toBe('anonymous')
  })

  it('sin sesión no pide token a nadie', async () => {
    const calls = countRefreshes()
    endSession()
    expect(await getAccessToken()).toBeNull()
    expect(calls.count).toBe(0)
  })
})

describe('reautenticación y nombre de jugador', () => {
  it('confirmar la contraseña da un token nuevo sin tocar la cookie', async () => {
    await login({ email: 'felc@example.com', password: 'a-long-passphrase' })
    await reauthenticate('a-long-passphrase')
    expect(await getAccessToken()).toBe('access-reauth')
  })

  it('una contraseña equivocada lanza INVALID_CREDENTIALS y la sesión sigue', async () => {
    await login({ email: 'felc@example.com', password: 'a-long-passphrase' })
    server.use(http.post(url('/auth/reauthenticate'), () => problem(401, 'INVALID_CREDENTIALS')))

    const error = await reauthenticate('wrong').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ code: 'INVALID_CREDENTIALS' })
    expect(getSession().status).toBe('authenticated')
  })

  it('el nombre nuevo se ve al instante y queda en la sesión guardada', async () => {
    await login({ email: 'felc@example.com', password: 'a-long-passphrase' })
    updateSessionPlayer({ ...felc, username: 'Felc_Nuevo' })

    expect(getSession().player?.username).toBe('Felc_Nuevo')
    expect(readOfflineSession()?.username).toBe('Felc_Nuevo')
  })

  it('no cambia el nombre de otra cuenta ni sin sesión', async () => {
    await login({ email: 'felc@example.com', password: 'a-long-passphrase' })
    updateSessionPlayer({ ...felc, id: 'otra-cuenta', username: 'Intruso' })
    expect(getSession().player?.username).toBe('Felc')

    endSession()
    updateSessionPlayer({ ...felc, username: 'Intruso' })
    expect(getSession().player).toBeNull()
  })
})

describe('cerrar la sesión después de salir de /app', () => {
  it('el aviso se toma una sola vez', () => {
    expect(takeScheduledEnd()).toBe(false)
    scheduleEndSession()
    expect(takeScheduledEnd()).toBe(true)
    expect(takeScheduledEnd()).toBe(false)
  })
})