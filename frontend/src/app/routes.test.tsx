import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderRoute } from '@/test/renderRoute'

describe('navegación', () => {
  it('una ruta privada sin sesión manda a /login y recuerda a dónde iba', async () => {
    const { router } = renderRoute('/app/history?type=SESSION')

    expect(await screen.findByRole('heading', { level: 1, name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
    expect(new URLSearchParams(router.state.location.search).get('next')).toBe('/app/history?type=SESSION')
  })

  it('una dirección que no existe muestra la página 404 dentro del layout', async () => {
    renderRoute('/no-existe')

    expect(await screen.findByRole('heading', { level: 1, name: 'Página no encontrada' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeInTheDocument()
  })

  it('el layout público ofrece entrar o crear cuenta a quien no tiene sesión', async () => {
    renderRoute('/register')

    expect(await screen.findByRole('heading', { level: 1, name: 'Crear cuenta' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: 'Saltar al contenido' })).toHaveAttribute('href', '#main')
  })
})