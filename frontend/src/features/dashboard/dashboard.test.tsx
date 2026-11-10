import { screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { paged, problem, url } from '@/test/msw/handlers'
import { server } from '@/test/msw/server'
import { renderRoute } from '@/test/renderRoute'
import { signedIn } from '@/test/session'

beforeEach(() => signedIn())

describe('resumen', () => {
  it('muestra el resumen de la cuenta, la última partida y la actividad reciente', async () => {
    renderRoute('/app')

    expect(await screen.findByTestId('greeting')).toHaveTextContent('Hola, Felc')
    expect(await screen.findByText('3 h 12 min')).toBeInTheDocument()
    expect(screen.getByText('2 de 6')).toBeInTheDocument()

    const lastSave = await screen.findByTestId('last-save')
    expect(await within(lastSave).findByRole('link', { name: 'Ver detalle de la partida 1' }))
      .toHaveAttribute('href', '/app/saves/1')
    expect(lastSave).toHaveTextContent('Tsuki · Capítulo 1 · 1 h 52 min')
    expect(lastSave).toHaveTextContent('Guardada el 20 de octubre de 2026')

    const activity = await screen.findByTestId('recent-activity')
    expect(await within(activity).findAllByTestId('history-item')).toHaveLength(5)
    expect(within(activity).getByRole('link', { name: 'Ver todo el historial' })).toHaveAttribute('href', '/app/history')
  })

  it('la última partida es la guardada más recientemente, no la ranura 1', async () => {
    server.use(http.get(url('/account/saves'), () => HttpResponse.json([
      { slot: 1, activeCharacter: 'TSUKI', currentChapter: 1, lastMilestone: null, milestonesCompleted: 1, milestonesTotal: 4, playTimeSec: 600, updatedAt: '2026-10-01T18:00:00Z', version: 1 },
      { slot: 3, activeCharacter: 'HIKARI', currentChapter: 2, lastMilestone: null, milestonesCompleted: 4, milestonesTotal: 4, playTimeSec: 600, updatedAt: '2026-10-21T18:00:00Z', version: 5 },
    ])))
    renderRoute('/app')

    const lastSave = await screen.findByTestId('last-save')
    expect(await within(lastSave).findByRole('link', { name: 'Ver detalle de la partida 3' })).toBeInTheDocument()
    expect(lastSave).toHaveTextContent('Hikari · Capítulo 2')
  })

  it('una cuenta nueva sin partidas ni actividad explica cómo empezar', async () => {
    server.use(
      http.get(url('/account/saves'), () => HttpResponse.json([])),
      http.get(url('/account/history'), ({ request }) => paged([], request)),
    )
    renderRoute('/app')

    expect(await within(await screen.findByTestId('last-save')).findByText('Todavía no tienes partidas en la nube')).toBeInTheDocument()
    expect(await within(await screen.findByTestId('recent-activity')).findByText('Aún no hay actividad')).toBeInTheDocument()
  })

  it('si falla una sección las demás se siguen viendo', async () => {
    server.use(http.get(url('/account/history'), () => problem(500, 'INTERNAL_ERROR')))
    renderRoute('/app')

    const activity = await screen.findByTestId('recent-activity')
    expect(await within(activity).findByRole('alert')).toHaveTextContent('Algo falló de nuestro lado.')
    expect(await within(await screen.findByTestId('last-save')).findByRole('link', { name: 'Ver detalle de la partida 1' })).toBeInTheDocument()
    expect(screen.getByText('2 de 6')).toBeInTheDocument()
  })

  it('pide solo las últimas 5 entradas del historial', async () => {
    const sizes: (string | null)[] = []
    server.use(http.get(url('/account/history'), ({ request }) => {
      sizes.push(new URL(request.url).searchParams.get('size'))
      return paged([], request)
    }))
    renderRoute('/app')

    await within(await screen.findByTestId('recent-activity')).findByText('Aún no hay actividad')
    expect(sizes).toEqual(['5'])
  })
})