import { screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { problem, url } from '@/test/msw/handlers'
import { server } from '@/test/msw/server'
import { renderRoute } from '@/test/renderRoute'
import { signedIn } from '@/test/session'

beforeEach(() => signedIn())

describe('logros del jugador', () => {
  it('muestra el progreso y cada logro con su estado', async () => {
    renderRoute('/app/achievements')

    expect(await screen.findAllByTestId('achievement-item')).toHaveLength(6)
    expect(screen.getByText('2 de 6 logros desbloqueados')).toBeInTheDocument()
    const progress = screen.getByRole('progressbar', { name: '2 de 6 logros desbloqueados' })
    expect(progress).toHaveAttribute('value', '2')
    expect(progress).toHaveAttribute('max', '6')

    const [first, , third] = screen.getAllByTestId('achievement-item')
    expect(first).toHaveAttribute('data-unlocked', 'true')
    expect(within(first).getByRole('heading', { name: 'Primeros pasos' })).toBeInTheDocument()
    expect(first).toHaveTextContent('Desbloqueado el 10 de octubre de 2026')
    expect(third).toHaveAttribute('data-unlocked', 'false')
    expect(third).toHaveTextContent('Vence al guardián de la primera zona.')
    expect(third).toHaveTextContent('Bloqueado')
  })

  it('un logro oculto y bloqueado sigue enmascarado', async () => {
    renderRoute('/app/achievements')

    const hidden = (await screen.findAllByTestId('achievement-item')).find((li) => li.dataset.achievementId === 'rulebreaker')
    expect(hidden).toHaveAttribute('data-hidden', 'true')
    expect(hidden).toHaveTextContent('Logro oculto')
    expect(hidden).toHaveTextContent('Se revela al desbloquearlo.')
  })

  it('un logro oculto ya desbloqueado se muestra completo', async () => {
    server.use(http.get(url('/account/achievements'), () => HttpResponse.json([
      { id: 'rulebreaker', name: 'Rulebreaker', description: 'Rompe una regla del cielo.', iconKey: null, hidden: true, sortOrder: 50, unlocked: true, unlockedAt: '2026-10-15T18:00:00Z' },
    ])))
    renderRoute('/app/achievements')

    const [item] = await screen.findAllByTestId('achievement-item')
    expect(item).toHaveTextContent('Rompe una regla del cielo.')
    expect(item).toHaveTextContent('Desbloqueado el 15 de octubre de 2026')
    expect(screen.getByText('1 de 1 logros desbloqueados')).toBeInTheDocument()
  })

  it('sin logros publicados lo dice', async () => {
    server.use(http.get(url('/account/achievements'), () => HttpResponse.json([])))
    renderRoute('/app/achievements')

    expect(await screen.findByText('Todavía no hay logros publicados.')).toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('un error ofrece reintentar', async () => {
    server.use(http.get(url('/account/achievements'), () => problem(500, 'INTERNAL_ERROR')))
    renderRoute('/app/achievements')

    expect(await screen.findByRole('alert')).toHaveTextContent('Algo falló de nuestro lado.')
  })

  it('pide el estado del jugador con su token', async () => {
    const auth: (string | null)[] = []
    server.use(http.get(url('/account/achievements'), ({ request }) => {
      auth.push(request.headers.get('Authorization'))
      return HttpResponse.json([])
    }))
    renderRoute('/app/achievements')

    await screen.findByText('Todavía no hay logros publicados.')
    expect(auth).toEqual(['Bearer access-1'])
  })
})