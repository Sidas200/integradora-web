import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'
import { problem, url } from '@/test/msw/handlers'
import { server } from '@/test/msw/server'
import { renderRoute } from '@/test/renderRoute'

describe('noticias', () => {
  it('pagina con Cargar más hasta mostrar todas', async () => {
    const user = userEvent.setup()
    renderRoute('/news')

    expect(await screen.findAllByTestId('news-item')).toHaveLength(6)
    expect(screen.getByText('6 de 8')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cargar más' }))

    expect(await screen.findByText('8 de 8')).toBeInTheDocument()
    expect(screen.getAllByTestId('news-item')).toHaveLength(8)
    expect(screen.queryByRole('button', { name: 'Cargar más' })).not.toBeInTheDocument()
  })

  it('una lista vacía explica qué pasa', async () => {
    server.use(http.get(url('/news'), () =>
      Response.json({ content: [], page: { number: 0, size: 6, totalElements: 0, totalPages: 0 } })))
    renderRoute('/news')

    expect(await screen.findByText('Todavía no hay noticias')).toBeInTheDocument()
  })

  it('un error de la API ofrece reintentar', async () => {
    server.use(http.get(url('/news'), () => problem(500, 'INTERNAL_ERROR')))
    renderRoute('/news')

    expect(await screen.findByRole('alert')).toHaveTextContent('Algo falló de nuestro lado.')
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })

  it('el detalle convierte el Markdown en HTML', async () => {
    renderRoute('/news/devlog-01')

    expect(await screen.findByRole('heading', { level: 1, name: 'Devlog #1' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Avance 1' })).toBeInTheDocument()
    expect(screen.getByText('1', { selector: 'strong' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver a noticias' })).toHaveAttribute('href', '/news')
  })

  it('un slug que no existe muestra "Esta noticia no existe"', async () => {
    renderRoute('/news/no-existe')

    expect(await screen.findByRole('heading', { level: 1, name: 'Esta noticia no existe' })).toBeInTheDocument()
  })
})