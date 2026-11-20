import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderRoute } from '@/test/renderRoute'
import { COOKIES, PRIVACY } from './content/legal'
import { TEAM } from './content/team'

describe('páginas del estudio', () => {
  it('Sobre nosotros presenta al equipo con sus roles de Scrum', async () => {
    renderRoute('/nosotros')

    expect(await screen.findByRole('heading', { level: 1, name: 'Sobre Hex Studio' })).toBeInTheDocument()
    const team = screen.getByRole('region', { name: 'Las personas detrás de la promesa' })
    expect(within(team).getAllByRole('listitem')).toHaveLength(TEAM.length)
    expect(within(team).getByText('Scrum Master')).toBeInTheDocument()
    expect(within(team).getAllByText('Product Owner').length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { level: 3, name: 'La app móvil' })).toBeInTheDocument()
  })

  it('el aviso de privacidad muestra todas sus secciones y enlaza a la política de cookies', async () => {
    renderRoute('/privacidad')

    expect(await screen.findByRole('heading', { level: 1, name: 'Aviso de privacidad' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(PRIVACY.sections.length)
    const contents = screen.getByRole('navigation', { name: 'Contenido' })
    expect(within(contents).getByRole('link', { name: 'Política de cookies' })).toHaveAttribute('href', '/cookies')
    expect(screen.getByText(/Secretaría Anticorrupción y Buen Gobierno/)).toBeInTheDocument()
  })

  it('la política de cookies describe la cookie de sesión y el almacenamiento local', async () => {
    renderRoute('/cookies')

    expect(await screen.findByRole('heading', { level: 1, name: 'Política de cookies' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(COOKIES.sections.length)
    expect(screen.getByRole('rowheader', { name: 'tdimp_rt' })).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: 'Almacenamiento local: tdimp.theme' })).toBeInTheDocument()
  })

  it('el pie de página enlaza a las páginas legales y del estudio', async () => {
    renderRoute('/news')

    const footer = await screen.findByRole('contentinfo')
    expect(within(footer).getByRole('link', { name: 'Aviso de privacidad' })).toHaveAttribute('href', '/privacidad')
    expect(within(footer).getByRole('link', { name: 'Política de cookies' })).toHaveAttribute('href', '/cookies')
    expect(within(footer).getByRole('link', { name: 'Sobre nosotros' })).toHaveAttribute('href', '/nosotros')
    expect(within(footer).getByText(/Todos los derechos reservados/)).toBeInTheDocument()
  })
})
