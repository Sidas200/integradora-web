import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { accountFixture, tokenFixture } from '@/test/msw/fixtures'
import { problem, url } from '@/test/msw/handlers'
import { server } from '@/test/msw/server'
import { renderRoute } from '@/test/renderRoute'
import { nextPath } from './nextPath'

/** Records what the PWA sends to an endpoint. */
function spy(method: 'get' | 'post', path: string, reply: (request: Request, n: number) => Response | Promise<Response>) {
  const calls: Request[] = []
  server.use(http[method](url(path), ({ request }) => {
    calls.push(request.clone())
    return reply(request, calls.length)
  }))
  return calls
}

describe('autenticación web', () => {
  it('inicia sesión como WEB y vuelve a la página que pedía, con el token en /account', async () => {
    const user = userEvent.setup()
    const logins = spy('post', '/auth/login', () => HttpResponse.json(tokenFixture('access-1')))
    const accounts = spy('get', '/account', () => HttpResponse.json(accountFixture))
    const { router } = renderRoute('/login?next=%2Fapp')

    await user.type(await screen.findByLabelText('Correo'), 'Felc@Example.com')
    await user.type(screen.getByLabelText('Contraseña'), 'a-long-passphrase')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByTestId('greeting')).toHaveTextContent('Hola, Felc')
    expect(await screen.findByText('2 de 6')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/app')
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument()

    expect(await logins[0].json()).toEqual({ email: 'felc@example.com', password: 'a-long-passphrase', client: 'WEB' })
    expect(accounts[0].headers.get('Authorization')).toBe('Bearer access-1')
  })

  it('credenciales incorrectas muestran un solo mensaje y no abren sesión', async () => {
    const user = userEvent.setup()
    server.use(http.post(url('/auth/login'), () => problem(401, 'INVALID_CREDENTIALS')))
    const { router } = renderRoute('/login')

    await user.type(await screen.findByLabelText('Correo'), 'felc@example.com')
    await user.type(screen.getByLabelText('Contraseña'), 'wrong-password')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByTestId('auth-error')).toHaveTextContent('Correo o contraseña incorrectos.')
    expect(screen.getByLabelText('Contraseña')).toHaveValue('')
    expect(router.state.location.pathname).toBe('/login')
  })

  it('el registro valida en el navegador antes de llamar a la API', async () => {
    const user = userEvent.setup()
    const registers = spy('post', '/auth/register', () => HttpResponse.json(tokenFixture(), { status: 201 }))
    renderRoute('/register')

    await user.type(await screen.findByLabelText('Correo'), 'felc@example.com')
    await user.type(screen.getByLabelText('Nombre de jugador'), 'no vale')
    await user.type(screen.getByLabelText('Contraseña'), 'corta')
    await user.type(screen.getByLabelText('Repite la contraseña'), 'otra')
    await user.click(screen.getByRole('button', { name: 'Crear mi cuenta' }))

    expect(await screen.findByText('De 3 a 20 letras, números o guion bajo.')).toBeInTheDocument()
    expect(screen.getByText('La contraseña debe tener entre 8 y 72 caracteres.')).toBeInTheDocument()
    expect(screen.getByText('Las contraseñas no coinciden.')).toBeInTheDocument()
    expect(screen.getByText('Debes aceptar el aviso de privacidad para crear la cuenta.')).toBeInTheDocument()
    expect(registers).toHaveLength(0)
  })

  it('un correo ya registrado (409) se marca en su campo', async () => {
    const user = userEvent.setup()
    const registers = spy('post', '/auth/register', () =>
      problem(409, 'EMAIL_IN_USE', { errors: [{ field: 'email', code: 'IN_USE', message: 'Email is already registered.' }] }))
    renderRoute('/register')

    await user.type(await screen.findByLabelText('Correo'), 'felc@example.com')
    await user.type(screen.getByLabelText('Nombre de jugador'), 'Felc_2')
    await user.type(screen.getByLabelText('Contraseña'), 'a-long-passphrase')
    await user.type(screen.getByLabelText('Repite la contraseña'), 'a-long-passphrase')
    await user.click(screen.getByLabelText('Acepto el aviso de privacidad'))
    await user.click(screen.getByRole('button', { name: 'Crear mi cuenta' }))

    const email = screen.getByLabelText('Correo')
    expect(await screen.findByText('Ese correo ya tiene una cuenta.')).toBeInTheDocument()
    expect(email).toHaveAttribute('aria-invalid', 'true')
    expect(await registers[0].json()).toMatchObject({ username: 'Felc_2', acceptedPrivacyNotice: true, client: 'WEB' })
  })

  it('al abrir la app recupera la sesión con la cookie y el header anti-CSRF', async () => {
    const refreshes = spy('post', '/auth/refresh', () => HttpResponse.json(tokenFixture('access-1')))
    renderRoute('/app')

    expect(await screen.findByTestId('greeting')).toHaveTextContent('Hola, Felc')
    expect(refreshes).toHaveLength(1)
    expect(refreshes[0].headers.get('X-Requested-With')).toBe('tdimp-pwa')
    expect(await refreshes[0].text()).toBe('{}')
  })

  it('un access token vencido se renueva una sola vez y la petición se repite', async () => {
    const refreshes = spy('post', '/auth/refresh', (_, n) => HttpResponse.json(tokenFixture(`access-${n}`)))
    const accounts = spy('get', '/account', (request) =>
      request.headers.get('Authorization') === 'Bearer access-1'
        ? problem(401, 'TOKEN_EXPIRED')
        : HttpResponse.json(accountFixture))
    renderRoute('/app')

    expect(await screen.findByText('2 de 6')).toBeInTheDocument()
    expect(refreshes).toHaveLength(2) // al abrir la app + al vencer el token
    expect(accounts.map((r) => r.headers.get('Authorization'))).toEqual(['Bearer access-1', 'Bearer access-2'])
  })

  it('si la sesión ya no se puede renovar, manda a /login', async () => {
    let refreshed = false
    server.use(http.post(url('/auth/refresh'), () => {
      if (refreshed) return problem(401, 'INVALID_SESSION')
      refreshed = true
      return HttpResponse.json(tokenFixture('access-1'))
    }))
    server.use(http.get(url('/account'), () => problem(401, 'TOKEN_EXPIRED')))
    const { router } = renderRoute('/app')

    expect(await screen.findByRole('heading', { level: 1, name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
  })

  it('cerrar sesión revoca en la API y las rutas privadas vuelven a pedir login', async () => {
    const user = userEvent.setup()
    spy('post', '/auth/refresh', () => HttpResponse.json(tokenFixture()))
    const logouts = spy('post', '/auth/logout', () => new HttpResponse(null, { status: 204 }))
    const { router } = renderRoute('/app')

    await screen.findByTestId('greeting')
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }))

    const nav = await screen.findByRole('navigation', { name: 'Navegación principal' })
    expect(await within(nav).findByRole('link', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/')
    expect(logouts[0].headers.get('X-Requested-With')).toBe('tdimp-pwa')

    await router.navigate('/app')
    expect(await screen.findByRole('heading', { level: 1, name: 'Iniciar sesión' })).toBeInTheDocument()
  })
})

describe('cerrar sesión desde una página pública', () => {
  it('también funciona estando ya en el inicio', async () => {
    const user = userEvent.setup()
    spy('post', '/auth/refresh', () => HttpResponse.json(tokenFixture()))
    renderRoute('/')

    await user.click(await screen.findByRole('button', { name: 'Cerrar sesión' }))

    const nav = screen.getByRole('navigation', { name: 'Navegación principal' })
    expect(await within(nav).findByRole('link', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })
})

describe('nextPath', () => {
  it('solo acepta rutas de este sitio', () => {
    expect(nextPath('?next=%2Fapp%2Fsaves')).toBe('/app/saves')
    expect(nextPath('?next=%2F%2Fevil.com')).toBe('/app')
    expect(nextPath('?next=https%3A%2F%2Fevil.com')).toBe('/app')
    expect(nextPath('?next=%2Flogin')).toBe('/app')
    expect(nextPath('')).toBe('/app')
  })
})