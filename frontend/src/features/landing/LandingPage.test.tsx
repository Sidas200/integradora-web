import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'
import { problem, url } from '@/test/msw/handlers'
import { server } from '@/test/msw/server'
import { renderRoute } from '@/test/renderRoute'

describe('landing', () => {
  it('muestra todas las secciones y lee noticias y logros de la API', async () => {
    renderRoute('/')

    expect(await screen.findByRole('heading', { level: 1, name: 'The Day I Made That Promise' })).toBeInTheDocument()
    for (const name of ['Una promesa que desafiará al cielo', 'Explora, combate, fabrica', 'Personajes', 'Ficha técnica', 'Consigue el juego']) {
      expect(screen.getByRole('heading', { level: 2, name })).toBeInTheDocument()
    }

    const news = screen.getByRole('region', { name: 'Últimas noticias' })
    expect(await within(news).findAllByRole('article')).toHaveLength(3)
    expect(within(news).getByRole('link', { name: 'Ver todas las noticias' })).toHaveAttribute('href', '/news')

    const achievements = screen.getByRole('region', { name: 'Logros por descubrir' })
    expect(await within(achievements).findByText('Primeros pasos')).toBeInTheDocument()
    expect(within(achievements).getByText('Logro oculto')).toBeInTheDocument()
    expect(within(achievements).getByText('Se revela al desbloquearlo.')).toBeInTheDocument()
  })

  it('sin tienda el botón Comprar está desactivado y dice Próximamente', async () => {
    renderRoute('/')

    const buy = await screen.findByRole('region', { name: 'Consigue el juego' })
    expect(within(buy).getByRole('button', { name: 'Comprar' })).toBeDisabled()
    expect(within(buy).getByText('Próximamente')).toBeInTheDocument()
  })
})

describe('aviso de lanzamiento', () => {
  it('valida en el navegador antes de llamar a la API', async () => {
    const user = userEvent.setup()
    renderRoute('/')

    await user.click(await screen.findByRole('button', { name: 'Avisarme' }))

    expect(await screen.findByText('Este campo es obligatorio.')).toBeInTheDocument()
    expect(screen.getByText('Necesitamos tu consentimiento para avisarte.')).toBeInTheDocument()
    expect(screen.getByLabelText('Correo')).toHaveAttribute('aria-invalid', 'true')
  })

  it('envía el correo en minúsculas y confirma con 202', async () => {
    let sent: unknown
    server.use(http.post(url('/subscriptions'), async ({ request }) => {
      sent = await request.json()
      return new Response(null, { status: 202 })
    }))
    const user = userEvent.setup()
    renderRoute('/')

    await user.type(await screen.findByLabelText('Correo'), 'Felc@Example.com')
    await user.selectOptions(screen.getByLabelText('Idioma'), 'en')
    await user.click(screen.getByLabelText('Acepto el aviso de privacidad'))
    await user.click(screen.getByRole('button', { name: 'Avisarme' }))

    expect(await screen.findByTestId('subscribe-result')).toHaveTextContent('¡Listo! Te avisaremos cuando salga el juego.')
    expect(sent).toEqual({ email: 'felc@example.com', language: 'en', consent: true })
    expect(screen.getByLabelText('Correo')).toHaveValue('')
  })

  it('si el Service Worker la encola avisa que se enviará al volver la red', async () => {
    server.use(http.post(url('/subscriptions'), () => new Response(null, { status: 202, headers: { 'X-Queued': '1' } })))
    const user = userEvent.setup()
    renderRoute('/')

    await user.type(await screen.findByLabelText('Correo'), 'felc@example.com')
    await user.click(screen.getByLabelText('Acepto el aviso de privacidad'))
    await user.click(screen.getByRole('button', { name: 'Avisarme' }))

    expect(await screen.findByTestId('subscribe-result')).toHaveTextContent('Sin conexión: guardamos tu registro')
  })

  it('muestra en el campo el error que regresa la API', async () => {
    server.use(http.post(url('/subscriptions'), () =>
      problem(400, 'VALIDATION_FAILED', { errors: [{ field: 'email', code: 'Email', message: 'must be a well-formed email address' }] })))
    const user = userEvent.setup()
    renderRoute('/')

    await user.type(await screen.findByLabelText('Correo'), 'felc@example.com')
    await user.click(screen.getByLabelText('Acepto el aviso de privacidad'))
    await user.click(screen.getByRole('button', { name: 'Avisarme' }))

    expect(await screen.findByText('Escribe un correo válido.')).toBeInTheDocument()
    expect(screen.getByTestId('subscribe-result')).toHaveTextContent('Revisa los datos marcados.')
  })
})