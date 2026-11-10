import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { historyFixtures } from '@/test/msw/fixtures'
import { paged, problem, url } from '@/test/msw/handlers'
import { server } from '@/test/msw/server'
import { renderRoute } from '@/test/renderRoute'
import { signedIn } from '@/test/session'

beforeEach(() => signedIn())

const filter = () => screen.getByRole('group', { name: 'Filtrar por tipo' })

describe('historial', () => {
  it('muestra sesiones, logros e hitos con su texto y pagina con Cargar más', async () => {
    const user = userEvent.setup()
    renderRoute('/app/history')

    expect(await screen.findAllByTestId('history-item')).toHaveLength(20)
    expect(screen.getByText('20 de 23 registros')).toBeInTheDocument()

    const [session, achievement, milestone] = screen.getAllByTestId('history-item')
    expect(session).toHaveTextContent('Sesión de juego')
    expect(session).toHaveTextContent('Partida 1 · 28 min')
    expect(achievement).toHaveTextContent('Logro desbloqueado: Logro 1')
    expect(achievement).not.toHaveTextContent('Partida')
    expect(milestone).toHaveTextContent('Hito completado: Hito 2')
    expect(milestone).toHaveTextContent('Partida 1 · a las 1 h 30 min de juego')

    await user.click(screen.getByRole('button', { name: 'Cargar más' }))

    expect(await screen.findByText('23 de 23 registros')).toBeInTheDocument()
    expect(screen.getAllByTestId('history-item')).toHaveLength(23)
    expect(screen.queryByRole('button', { name: 'Cargar más' })).not.toBeInTheDocument()
  })

  it('el filtro pide solo ese tipo y queda en la URL', async () => {
    const user = userEvent.setup()
    const types: (string | null)[] = []
    server.use(http.get(url('/account/history'), ({ request }) => {
      const type = new URL(request.url).searchParams.get('type')
      types.push(type)
      return paged(type ? historyFixtures.filter((h) => h.type === type) : historyFixtures, request)
    }))
    const { router } = renderRoute('/app/history')

    await screen.findByText('20 de 23 registros')
    expect(within(filter()).getByRole('button', { name: 'Todo' })).toHaveAttribute('aria-pressed', 'true')

    await user.click(within(filter()).getByRole('button', { name: 'Logros' }))

    expect(await screen.findByText('8 de 8 registros')).toBeInTheDocument()
    expect(screen.getAllByTestId('history-item').every((li) => li.dataset.type === 'ACHIEVEMENT')).toBe(true)
    expect(within(filter()).getByRole('button', { name: 'Logros' })).toHaveAttribute('aria-pressed', 'true')
    expect(router.state.location.search).toBe('?type=ACHIEVEMENT')
    expect(types).toEqual([null, 'ACHIEVEMENT'])

    await user.click(within(filter()).getByRole('button', { name: 'Todo' }))
    expect(await screen.findByText('20 de 23 registros')).toBeInTheDocument()
    expect(router.state.location.search).toBe('')
  })

  it('abrir con ?type= aplica ese filtro', async () => {
    renderRoute('/app/history?type=MILESTONE')
    expect(await screen.findByText('7 de 7 registros')).toBeInTheDocument()
    expect(within(filter()).getByRole('button', { name: 'Hitos' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('un tipo que no existe en la URL muestra todo', async () => {
    renderRoute('/app/history?type=OTRO')
    expect(await screen.findByText('20 de 23 registros')).toBeInTheDocument()
    expect(within(filter()).getByRole('button', { name: 'Todo' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('sin actividad explica cómo llenarlo', async () => {
    server.use(http.get(url('/account/history'), ({ request }) => paged([], request)))
    renderRoute('/app/history')

    expect(await screen.findByText('Aún no hay actividad')).toBeInTheDocument()
    expect(screen.getByText('Juega una partida con tu cuenta iniciada y aparecerá aquí.')).toBeInTheDocument()
  })

  it('un filtro sin resultados lo dice y deja cambiar de filtro', async () => {
    const user = userEvent.setup()
    server.use(http.get(url('/account/history'), ({ request }) =>
      paged(new URL(request.url).searchParams.get('type') ? [] : historyFixtures, request)))
    renderRoute('/app/history?type=SESSION')

    expect(await screen.findByText('No hay registros de este tipo')).toBeInTheDocument()
    await user.click(within(filter()).getByRole('button', { name: 'Todo' }))
    expect(await screen.findByText('20 de 23 registros')).toBeInTheDocument()
  })

  it('un error ofrece reintentar', async () => {
    server.use(http.get(url('/account/history'), () => problem(500, 'INTERNAL_ERROR')))
    renderRoute('/app/history')

    expect(await screen.findByRole('alert')).toHaveTextContent('Algo falló de nuestro lado.')
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })
})