import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { achievementFixtures } from '@/test/msw/fixtures'
import { problem, url } from '@/test/msw/handlers'
import { server } from '@/test/msw/server'
import { renderRoute } from '@/test/renderRoute'
import { signedIn } from '@/test/session'

/** The four states (README §7.5) of the sections that the screen tests did not reach: error and empty. */

describe('landing', () => {
  it('si fallan los logros, solo esa sección muestra el error y se puede reintentar', async () => {
    const user = userEvent.setup()
    let calls = 0
    server.use(http.get(url('/achievements'), () =>
      ++calls === 1 ? problem(500, 'INTERNAL_ERROR') : HttpResponse.json(achievementFixtures)))
    renderRoute('/')

    const section = await screen.findByRole('region', { name: 'Logros por descubrir' })
    expect(await within(section).findByRole('alert')).toHaveTextContent('Algo falló de nuestro lado.')
    expect(await screen.findByText('Devlog #1')).toBeInTheDocument() // the rest of the landing keeps working

    await user.click(within(section).getByRole('button', { name: 'Reintentar' }))
    expect(await within(section).findByText('Primeros pasos')).toBeInTheDocument()
  })

  it('sin logros publicados lo dice', async () => {
    server.use(http.get(url('/achievements'), () => HttpResponse.json([])))
    renderRoute('/')

    const section = await screen.findByRole('region', { name: 'Logros por descubrir' })
    expect(await within(section).findByText('Todavía no hay logros publicados.')).toBeInTheDocument()
  })

  it('si fallan las últimas noticias, su sección muestra el error', async () => {
    server.use(http.get(url('/news'), () => HttpResponse.error()))
    renderRoute('/')
    const section = await screen.findByRole('region', { name: 'Últimas noticias' })
    expect(await within(section).findByRole('alert')).toHaveTextContent('No hay conexión con el servidor.')
  })

  it('sin noticias la landing lo dice en su sección', async () => {
    server.use(http.get(url('/news'), () =>
      HttpResponse.json({ content: [], page: { number: 0, size: 3, totalElements: 0, totalPages: 0 } })))
    renderRoute('/')
    const section = await screen.findByRole('region', { name: 'Últimas noticias' })
    expect(await within(section).findByText('Todavía no hay noticias')).toBeInTheDocument()
  })
})

describe('detalle de noticia', () => {
  it('un error que no es 404 ofrece reintentar en lugar de decir que no existe', async () => {
    server.use(http.get(url('/news/:slug'), () => problem(500, 'INTERNAL_ERROR')))
    renderRoute('/news/devlog-01')

    expect(await screen.findByRole('alert')).toHaveTextContent('Algo falló de nuestro lado.')
    expect(screen.queryByText('Esta noticia no existe')).not.toBeInTheDocument()
  })
})

describe('secciones privadas', () => {
  it('si fallan las sesiones de una partida, el resto del detalle se sigue viendo', async () => {
    signedIn()
    server.use(http.get(url('/account/sessions'), () => problem(500, 'INTERNAL_ERROR')))
    renderRoute('/app/saves/1')

    const sessions = await screen.findByRole('region', { name: 'Sesiones de juego' })
    expect(await within(sessions).findByRole('alert')).toHaveTextContent('Algo falló de nuestro lado.')
    expect(screen.getByRole('region', { name: 'Estadísticas' })).toBeInTheDocument()
  })

  it('si fallan los dispositivos, el cambio de contraseña sigue disponible', async () => {
    signedIn()
    server.use(http.get(url('/account/devices'), () => problem(500, 'INTERNAL_ERROR')))
    renderRoute('/app/account/security')

    const devices = await screen.findByRole('region', { name: 'Dispositivos con sesión' })
    expect(await within(devices).findByRole('alert')).toHaveTextContent('Algo falló de nuestro lado.')
    expect(screen.getByRole('button', { name: 'Cambiar contraseña' })).toBeEnabled()
  })
})