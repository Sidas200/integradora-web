import { onlineManager } from '@tanstack/react-query'
import { cleanup, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { API_BASE_URL } from '@/shared/api/client'
import { createIdbPersister } from '@/shared/query/persister'
import { accountFixture } from '@/test/msw/fixtures'
import { problem, url } from '@/test/msw/handlers'
import { server } from '@/test/msw/server'
import { renderRoute } from '@/test/renderRoute'
import { signedIn } from '@/test/session'

/** README §8.5: the player's data in IndexedDB, read-only mode and the cleanup at logout. */

const SAVED_SESSION = 'tdimp.offline-session'
const READ_ONLY = /Modo lectura: no hay conexión con el servidor/

let onLine: MockInstance<() => boolean>

beforeEach(() => {
  onLine = vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(true)
})

afterEach(() => {
  onLine.mockRestore()
  onlineManager.setOnline(true)
})

/** What IndexedDB holds right now (null = nothing). */
async function persistedKeys(): Promise<string[] | null> {
  const client = await createIdbPersister(() => null).restoreClient()
  return client ? client.clientState.queries.map((q) => JSON.stringify(q.queryKey)) : null
}

/** First visit with network: the data of `path` ends up in IndexedDB. Then the tab is closed. */
async function visitOnline(path: string, ready: () => Promise<unknown>, key = '["account","profile"]') {
  signedIn()
  renderRoute(path)
  await ready()
  await waitFor(async () => expect(await persistedKeys()).toContain(key))
  cleanup()
  server.resetHandlers()
}

/** The browser has no network: every request to the API fails like fetch does without connection. */
function goOffline() {
  onLine.mockReturnValue(false)
  onlineManager.setOnline(false)
  server.use(http.all(`${API_BASE_URL}/*`, () => HttpResponse.error()))
}

function backOnline() {
  server.resetHandlers()
  signedIn('access-2')
  onLine.mockReturnValue(true)
  onlineManager.setOnline(true)
  window.dispatchEvent(new Event('online'))
}

describe('sin conexión', () => {
  it('al abrir sin red con una sesión guardada entra en modo lectura con los datos de la última visita', async () => {
    await visitOnline('/app', () => screen.findByText('2 de 6'))
    expect(JSON.parse(localStorage.getItem(SAVED_SESSION) ?? '{}')).toMatchObject({ username: 'Felc' })

    goOffline()
    renderRoute('/app')

    expect(await screen.findByText(READ_ONLY)).toBeInTheDocument()
    expect(screen.getByTestId('greeting')).toHaveTextContent('Hola, Felc')
    expect(await screen.findByText('2 de 6')).toBeInTheDocument()
    expect(await within(await screen.findByTestId('last-save')).findByRole('link', { name: 'Ver detalle de la partida 1' })).toBeInTheDocument()
    expect(await within(screen.getByTestId('recent-activity')).findAllByTestId('history-item')).toHaveLength(5)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('en modo lectura los botones que escriben están desactivados', async () => {
    await visitOnline('/app/account/settings', () => screen.findByLabelText('Volumen de la música'), '["account","settings"]')

    goOffline()
    renderRoute('/app/account/settings')

    expect(await screen.findByText(READ_ONLY)).toBeInTheDocument()
    expect(await screen.findByLabelText('Volumen de la música')).toHaveValue('80')
    expect(screen.getByRole('button', { name: 'Guardar configuración' })).toBeDisabled()
  })

  it('lo que no se guardó dice que aparecerá al volver la red en lugar de cargar para siempre', async () => {
    await visitOnline('/app', () => screen.findByText('2 de 6'))

    goOffline()
    renderRoute('/app/history?type=SESSION')

    expect(await screen.findByText(READ_ONLY)).toBeInTheDocument()
    expect(await screen.findByText(/Sin conexión: esto no se guardó para verse sin red/)).toBeInTheDocument()
  })

  it('al volver la red renueva la sesión, sale del modo lectura y refresca los datos', async () => {
    await visitOnline('/app', () => screen.findByText('2 de 6'))
    goOffline()
    renderRoute('/app')
    expect(await screen.findByText(READ_ONLY)).toBeInTheDocument()

    const accounts: (string | null)[] = []
    backOnline()
    server.use(http.get(url('/account'), ({ request }) => {
      accounts.push(request.headers.get('Authorization'))
      return HttpResponse.json(accountFixture)
    }))

    await waitFor(() => expect(screen.queryByText(READ_ONLY)).not.toBeInTheDocument())
    await waitFor(() => expect(accounts).toContain('Bearer access-2'))
  })

  it('si la API está caída (503) también entra en modo lectura', async () => {
    await visitOnline('/app', () => screen.findByText('2 de 6'))
    server.use(http.post(url('/auth/refresh'), () => problem(503, 'INTERNAL_ERROR')))
    renderRoute('/app')

    expect(await screen.findByText(READ_ONLY)).toBeInTheDocument()
    expect(await screen.findByText('2 de 6')).toBeInTheDocument()
  })

  it('sin una sesión guardada, abrir sin red manda a iniciar sesión', async () => {
    goOffline()
    const { router } = renderRoute('/app')

    expect(await screen.findByRole('heading', { level: 1, name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
  })

  it('los datos guardados de otro jugador no se muestran', async () => {
    await visitOnline('/app', () => screen.findByText('2 de 6'))
    localStorage.setItem(SAVED_SESSION, JSON.stringify({ id: 'otro-jugador', username: 'Otra', email: 'otra@example.com' }))

    goOffline()
    renderRoute('/app')

    expect(await screen.findByTestId('greeting')).toHaveTextContent('Hola, Otra')
    expect((await screen.findAllByText(/Sin conexión: esto no se guardó para verse sin red/)).length).toBeGreaterThan(0)
    expect(screen.queryByText('2 de 6')).not.toBeInTheDocument()
  })
})

describe('limpieza de los datos guardados', () => {
  it('cerrar sesión borra IndexedDB y la sesión guardada', async () => {
    const user = userEvent.setup()
    signedIn()
    renderRoute('/app')
    await screen.findByText('2 de 6')
    await waitFor(async () => expect(await persistedKeys()).toContain('["account","profile"]'))

    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    await screen.findByRole('link', { name: 'Iniciar sesión' })

    await waitFor(async () => expect(await persistedKeys()).toBeNull())
    expect(localStorage.getItem(SAVED_SESSION)).toBeNull()
  })

  it('una sesión que la API ya no acepta (401) borra lo guardado aunque haya datos', async () => {
    await visitOnline('/app', () => screen.findByText('2 de 6'))

    renderRoute('/app') // default refresh handler: 401 INVALID_SESSION

    expect(await screen.findByRole('heading', { level: 1, name: 'Iniciar sesión' })).toBeInTheDocument()
    await waitFor(async () => expect(await persistedKeys()).toBeNull())
    expect(localStorage.getItem(SAVED_SESSION)).toBeNull()
  })

  it('solo se guardan las consultas marcadas, nunca el catálogo público ni las noticias', async () => {
    signedIn()
    renderRoute('/app')
    await screen.findByText('2 de 6')

    await waitFor(async () => expect(await persistedKeys()).toEqual(expect.arrayContaining([
      '["account","profile"]', '["account","saves"]', '["account","history","recent",5]',
    ])))
    const keys = (await persistedKeys()) ?? []
    expect(keys.every((k) => k.startsWith('["account"'))).toBe(true)
  })
})