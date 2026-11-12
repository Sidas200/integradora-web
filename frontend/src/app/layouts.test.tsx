import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderRoute } from '@/test/renderRoute'
import { signedIn } from '@/test/session'
import { RouteErrorPage } from './pages/RouteErrorPage'
import { router } from './router'
import { routes } from './routes'


afterEach(() => vi.restoreAllMocks())

describe('layout público', () => {
  it('el enlace "Saltar al contenido" lleva al main, que puede recibir el foco', async () => {
    renderRoute('/news')

    expect(await screen.findByRole('link', { name: 'Saltar al contenido' })).toHaveAttribute('href', '#main')
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main')
    expect(screen.getByRole('main')).toHaveAttribute('tabindex', '-1')
  })

  it('con sesión ofrece Mi cuenta y Cerrar sesión en lugar de entrar o crear cuenta', async () => {
    signedIn()
    renderRoute('/news')

    const nav = await screen.findByRole('navigation', { name: 'Navegación principal' })
    expect(await within(nav).findByRole('link', { name: 'Mi cuenta' })).toHaveAttribute('href', '/app')
    expect(within(nav).getByRole('button', { name: 'Cerrar sesión' }).closest('li')).toHaveAttribute('data-session-player', 'Felc')
    expect(within(nav).queryByRole('link', { name: 'Iniciar sesión' })).not.toBeInTheDocument()
  })

  it('muestra el aviso que otra pantalla deja al navegar (cuenta eliminada)', async () => {
    const { router: memory } = renderRoute('/')
    await screen.findByRole('link', { name: 'Saltar al contenido' })

    await memory.navigate('/', { state: { notice: 'accountDeleted' } })

    expect(await screen.findByText('Tu cuenta y todos sus datos se eliminaron.')).toHaveAttribute('role', 'status')
  })
})

describe('panel del jugador', () => {
  it('marca la sección actual con aria-current', async () => {
    const user = userEvent.setup()
    signedIn()
    renderRoute('/app/saves')

    const nav = await screen.findByRole('navigation', { name: 'Navegación de la cuenta' })
    expect(within(nav).getByRole('link', { name: 'Partidas' })).toHaveAttribute('aria-current', 'page')
    expect(within(nav).getByRole('link', { name: 'Resumen' })).not.toHaveAttribute('aria-current')

    await user.click(within(nav).getByRole('link', { name: 'Logros' }))
    // the achievements page is lazy: the link becomes current once its chunk has loaded
    await waitFor(() => expect(within(nav).getByRole('link', { name: 'Logros' })).toHaveAttribute('aria-current', 'page'))
    expect(within(nav).getByRole('link', { name: 'Partidas' })).not.toHaveAttribute('aria-current')
  })

  it('con red y sesión no muestra el aviso de modo lectura', async () => {
    signedIn()
    renderRoute('/app')
    await screen.findByTestId('greeting')
    expect(screen.queryByText(/Modo lectura/)).not.toBeInTheDocument()
  })
})

describe('errores de ruta', () => {
  function Boom(): never {
    throw new Error('chunk failed to load')
  }

  it('un error al mostrar una ruta ofrece volver al inicio', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {}) // React reports the thrown error
    const memory = createMemoryRouter([{ path: '/', element: <Boom />, errorElement: <RouteErrorPage /> }])
    render(<RouterProvider router={memory} />)

    expect(screen.getByRole('heading', { level: 1, name: 'Algo salió mal' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ir al inicio' })).toHaveAttribute('href', '/')
  })

  it('un 404 de la ruta muestra la página no encontrada', async () => {
    const memory = createMemoryRouter([{
      path: '/',
      loader: () => {
        throw new Response('', { status: 404 })
      },
      element: <p>nunca</p>,
      errorElement: <RouteErrorPage />,
    }])
    render(<RouterProvider router={memory} />)

    expect(await screen.findByRole('heading', { level: 1, name: 'Página no encontrada' })).toBeInTheDocument()
  })
})

describe('router de la app', () => {
  it('usa el árbol de rutas de la app (sin /lab fuera de desarrollo)', () => {
    expect(router.routes).toHaveLength(routes.length)
  })
})