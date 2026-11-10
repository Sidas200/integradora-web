import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { problem, url } from '@/test/msw/handlers'
import { server } from '@/test/msw/server'
import { renderRoute } from '@/test/renderRoute'
import { signedIn } from '@/test/session'

beforeEach(() => signedIn())

describe('partidas', () => {
  it('muestra las tres ranuras: las usadas con su progreso y la vacía con qué hacer', async () => {
    renderRoute('/app/saves')

    expect(await screen.findByRole('heading', { level: 1, name: 'Partidas' })).toBeInTheDocument()
    const slots = await screen.findAllByRole('article')
    expect(slots).toHaveLength(3)

    const first = within(slots[0])
    expect(first.getByRole('heading', { name: 'Partida 1' })).toBeInTheDocument()
    expect(first.getByText('Tsuki · Capítulo 1')).toBeInTheDocument()
    expect(first.getByText('Primer santuario')).toBeInTheDocument()
    expect(first.getByText('3 de 4')).toBeInTheDocument()
    expect(first.getByText('1 h 52 min')).toBeInTheDocument()
    expect(first.getByText('20 de octubre de 2026')).toBeInTheDocument()
    expect(first.getByRole('link', { name: 'Ver detalle de la partida 1' })).toHaveAttribute('href', '/app/saves/1')

    const second = within(slots[1])
    expect(second.getByText('Hikari · Prólogo')).toBeInTheDocument()
    expect(second.getByText('Todavía ninguno')).toBeInTheDocument()
    expect(second.getByText('25 min')).toBeInTheDocument()

    expect(slots[2]).toHaveAttribute('data-empty', 'true')
    expect(within(slots[2]).getByText('Ranura vacía')).toBeInTheDocument()
    expect(within(slots[2]).queryByRole('link')).not.toBeInTheDocument()
  })

  it('sin partidas en la nube explica cómo tener una', async () => {
    server.use(http.get(url('/account/saves'), () => HttpResponse.json([])))
    renderRoute('/app/saves')

    expect(await screen.findByText('Todavía no tienes partidas en la nube')).toBeInTheDocument()
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
  })

  it('un error ofrece reintentar y al reintentar muestra las ranuras', async () => {
    const user = userEvent.setup()
    let calls = 0
    server.use(http.get(url('/account/saves'), () =>
      ++calls === 1 ? problem(500, 'INTERNAL_ERROR') : HttpResponse.json([])))
    renderRoute('/app/saves')

    expect(await screen.findByRole('alert')).toHaveTextContent('Algo falló de nuestro lado.')
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByText('Todavía no tienes partidas en la nube')).toBeInTheDocument()
    expect(calls).toBe(2)
  })
})

describe('detalle de partida', () => {
  it('muestra estadísticas, historia e inventario de la ranura', async () => {
    renderRoute('/app/saves/1')

    expect(await screen.findByRole('heading', { level: 1, name: 'Partida 1' })).toBeInTheDocument()
    expect(screen.getByText('Tsuki · Capítulo 1')).toBeInTheDocument()
    expect(screen.getByText('Guardada el 20 de octubre de 2026')).toBeInTheDocument()

    const stats = screen.getByRole('region', { name: 'Estadísticas' })
    expect(within(stats).getByText('148')).toBeInTheDocument()
    expect(within(stats).getByText('37')).toBeInTheDocument()

    const story = screen.getByRole('region', { name: 'Historia' })
    expect(within(story).getByText('3 de 4 hitos completados')).toBeInTheDocument()
    const milestones = within(story).getAllByRole('listitem')
    expect(milestones.map((m) => m.dataset.completed)).toEqual(['true', 'true', 'true', 'false'])
    expect(milestones[0]).toHaveTextContent('Despertar en la isla · Prólogo · Completado el 10 de octubre de 2026')
    expect(milestones[3]).toHaveTextContent('El guardián de la zona · Capítulo 1 · Pendiente')

    const inventory = screen.getByRole('region', { name: 'Inventario' })
    expect(within(inventory).getByText('Mineral carmesí').closest('li')).toHaveTextContent('Mineral carmesí × 5 · Material · Raro')
    expect(within(inventory).getByText('Filo templado').closest('li')).toHaveTextContent('Mejora · Épico')
  })

  it('pagina las sesiones de la ranura y marca la que sigue abierta', async () => {
    const user = userEvent.setup()
    renderRoute('/app/saves/1')

    const sessions = await screen.findByRole('region', { name: 'Sesiones de juego' })
    expect(await within(sessions).findAllByTestId('session-item')).toHaveLength(10)
    expect(within(sessions).getByText('10 de 12 sesiones')).toBeInTheDocument()
    expect(within(sessions).getAllByTestId('session-item')[0]).toHaveTextContent('Sin terminar · Windows')
    expect(within(sessions).getAllByTestId('session-item')[1]).toHaveTextContent('28 min · Windows')

    await user.click(within(sessions).getByRole('button', { name: 'Cargar más' }))

    expect(await within(sessions).findByText('12 de 12 sesiones')).toBeInTheDocument()
    expect(within(sessions).queryByRole('button', { name: 'Cargar más' })).not.toBeInTheDocument()
  })

  it('pide a la API solo las sesiones de esa ranura', async () => {
    const slots: (string | null)[] = []
    server.use(http.get(url('/account/sessions'), ({ request }) => {
      slots.push(new URL(request.url).searchParams.get('slot'))
      return HttpResponse.json({ content: [], page: { number: 0, size: 10, totalElements: 0, totalPages: 0 } })
    }))
    renderRoute('/app/saves/2')

    expect(await screen.findByText('Todavía no hay sesiones registradas en esta partida.')).toBeInTheDocument()
    expect(screen.getByText('El inventario está vacío.')).toBeInTheDocument()
    expect(slots).toEqual(['2'])
  })

  it('una ranura vacía (404) dice que la partida no existe y lleva de vuelta a la lista', async () => {
    renderRoute('/app/saves/3')

    expect(await screen.findByRole('heading', { level: 1, name: 'Esta partida no existe' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver a partidas' })).toHaveAttribute('href', '/app/saves')
  })

  it('una ranura fuera de 1–3 no llega a la API', async () => {
    let called = false
    server.use(http.get(url('/account/saves/:slot'), () => {
      called = true
      return problem(400, 'VALIDATION_FAILED')
    }))
    renderRoute('/app/saves/9')

    expect(await screen.findByRole('heading', { level: 1, name: 'Esta partida no existe' })).toBeInTheDocument()
    expect(called).toBe(false)
  })

  it('un error que no es 404 ofrece reintentar', async () => {
    server.use(http.get(url('/account/saves/:slot'), () => problem(500, 'INTERNAL_ERROR')))
    renderRoute('/app/saves/1')

    expect(await screen.findByRole('alert')).toHaveTextContent('Algo falló de nuestro lado.')
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })
})