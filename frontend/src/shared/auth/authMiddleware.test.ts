import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { api } from '@/shared/api/client'
import { accountFixture, settingsFixture, tokenFixture } from '@/test/msw/fixtures'
import { problem, url } from '@/test/msw/handlers'
import { server } from '@/test/msw/server'
import './AuthProvider' // registers authMiddleware on the shared client, like the app does
import { endSession, getSession, login } from './session'

/** Records the Authorization header of every request to `path`. */
function recordAuth(method: 'get' | 'put' | 'post', path: string, reply: (n: number, request: Request) => Response | Promise<Response>) {
  const seen: (string | null)[] = []
  server.use(http[method](url(path), ({ request }) => {
    seen.push(request.headers.get('Authorization'))
    return reply(seen.length, request)
  }))
  return seen
}

beforeEach(async () => {
  server.use(http.post(url('/auth/login'), () => HttpResponse.json(tokenFixture('access-1'))))
  await login({ email: 'felc@example.com', password: 'a-long-passphrase' })
})

afterEach(() => endSession())

describe('token en las peticiones', () => {
  it('las rutas privadas llevan Authorization: Bearer', async () => {
    const seen = recordAuth('get', '/account', () => HttpResponse.json(accountFixture))
    await api.GET('/account')
    expect(seen).toEqual(['Bearer access-1'])
  })

  it('las públicas nunca lo llevan (no se filtra a la caché del Service Worker)', async () => {
    const seen = recordAuth('get', '/news', () => HttpResponse.json({ content: [], page: { number: 0, size: 20, totalElements: 0, totalPages: 0 } }))
    await api.GET('/news')
    expect(seen).toEqual([null])
  })

  it('la reautenticación también es privada', async () => {
    const seen = recordAuth('post', '/auth/reauthenticate', () => HttpResponse.json(tokenFixture('access-reauth')))
    await api.POST('/auth/reauthenticate', { body: { password: 'a-long-passphrase' } })
    expect(seen).toEqual(['Bearer access-1'])
  })
})

describe('token vencido', () => {
  it('un 401 TOKEN_EXPIRED renueva una vez y repite la petición con su cuerpo', async () => {
    server.use(http.post(url('/auth/refresh'), () => HttpResponse.json(tokenFixture('access-2'))))
    const bodies: unknown[] = []
    const seen = recordAuth('put', '/account/settings', async (n, request) => {
      bodies.push(await request.json())
      return n === 1 ? problem(401, 'TOKEN_EXPIRED') : HttpResponse.json(settingsFixture)
    })

    const { data, response } = await api.PUT('/account/settings', { body: { ...settingsFixture, musicVolume: 10 } })

    expect(response.status).toBe(200)
    expect(data).toMatchObject({ musicVolume: 80 })
    expect(seen).toEqual(['Bearer access-1', 'Bearer access-2'])
    expect(bodies).toHaveLength(2)
    expect(bodies[1]).toMatchObject({ musicVolume: 10 }) // the body survived the retry
  })

  it('INVALID_CREDENTIALS no se arregla renovando: no repite', async () => {
    const seen = recordAuth('post', '/auth/reauthenticate', () => problem(401, 'INVALID_CREDENTIALS'))
    const { response } = await api.POST('/auth/reauthenticate', { body: { password: 'wrong' } })

    expect(response.status).toBe(401)
    expect(seen).toHaveLength(1)
    expect(getSession().status).toBe('authenticated')
  })

  it('un 401 sin cuerpo problem+json tampoco se repite', async () => {
    const seen = recordAuth('get', '/account', () => new HttpResponse('nope', { status: 401 }))
    const { response } = await api.GET('/account')

    expect(response.status).toBe(401)
    expect(seen).toHaveLength(1)
  })

  it('si la renovación falla, devuelve el 401 original y la sesión termina', async () => {
    server.use(http.post(url('/auth/refresh'), () => problem(401, 'INVALID_SESSION')))
    const seen = recordAuth('get', '/account', () => problem(401, 'TOKEN_EXPIRED'))

    const { response } = await api.GET('/account')

    expect(response.status).toBe(401)
    expect(seen).toHaveLength(1)
    expect(getSession().status).toBe('anonymous')
  })

  it('si la API rechaza también el token nuevo, la sesión termina', async () => {
    server.use(http.post(url('/auth/refresh'), () => HttpResponse.json(tokenFixture('access-2'))))
    const seen = recordAuth('get', '/account', () => problem(401, 'TOKEN_EXPIRED'))

    const { response } = await api.GET('/account')

    expect(response.status).toBe(401)
    expect(seen).toEqual(['Bearer access-1', 'Bearer access-2'])
    expect(getSession().status).toBe('anonymous')
  })

  it('otros errores pasan tal cual', async () => {
    const seen = recordAuth('get', '/account', () => problem(500, 'INTERNAL_ERROR'))
    const { response } = await api.GET('/account')

    expect(response.status).toBe(500)
    expect(seen).toHaveLength(1)
  })
})