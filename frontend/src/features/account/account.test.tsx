import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { accountFixture, devicesFixture, settingsFixture, tokenFixture } from '@/test/msw/fixtures'
import { problem, url } from '@/test/msw/handlers'
import { server } from '@/test/msw/server'
import { renderRoute } from '@/test/renderRoute'

/** Records what the PWA sends to an endpoint. */
function spy(method: 'get' | 'post' | 'put' | 'patch' | 'delete', path: string,
             reply: (request: Request, n: number) => Response | Promise<Response>) {
  const calls: Request[] = []
  server.use(http[method](url(path), ({ request }) => {
    calls.push(request.clone())
    return reply(request, calls.length)
  }))
  return calls
}

// Every test starts with a session: the refresh cookie is valid.
beforeEach(() => {
  server.use(http.post(url('/auth/refresh'), () => HttpResponse.json(tokenFixture('access-1'))))
})

describe('perfil', () => {
  it('cambia el nombre de jugador y el encabezado lo muestra al instante', async () => {
    const user = userEvent.setup()
    const patches = spy('patch', '/account', async (request) =>
      HttpResponse.json({ ...accountFixture, username: ((await request.json()) as { username: string }).username }))
    renderRoute('/app/account')

    const field = await screen.findByLabelText('Nombre de jugador')
    expect(field).toHaveValue('Felc')
    expect(screen.getByText('felc@example.com')).toBeInTheDocument()

    await user.clear(field)
    await user.type(field, 'Tsuki_99')
    await user.click(screen.getByRole('button', { name: 'Guardar nombre' }))

    expect(await screen.findByText('Listo, tu nombre de jugador se actualizó.')).toBeInTheDocument()
    expect(await patches[0].json()).toEqual({ username: 'Tsuki_99' })
    expect(patches[0].headers.get('Authorization')).toBe('Bearer access-1')
    expect(document.querySelector('[data-session-player]')).toHaveAttribute('data-session-player', 'Tsuki_99')
  })

  it('un nombre ocupado (409) se marca en el campo', async () => {
    const user = userEvent.setup()
    server.use(http.patch(url('/account'), () =>
      problem(409, 'USERNAME_IN_USE', { errors: [{ field: 'username', code: 'IN_USE', message: 'taken' }] })))
    renderRoute('/app/account')

    const field = await screen.findByLabelText('Nombre de jugador')
    await user.clear(field)
    await user.type(field, 'Ocupado')
    await user.click(screen.getByRole('button', { name: 'Guardar nombre' }))

    expect(await screen.findByText('Ese nombre ya está en uso. Prueba con otro.')).toBeInTheDocument()
    expect(field).toHaveAttribute('aria-invalid', 'true')
  })
})

describe('configuración', () => {
  it('guarda volumen, idioma y pantalla completa sin borrar los controles del juego', async () => {
    const user = userEvent.setup()
    const puts = spy('put', '/account/settings', async (request) =>
      HttpResponse.json({ ...((await request.json()) as object), updatedAt: '2026-10-23T05:00:00Z' }))
    renderRoute('/app/account/settings')

    const music = await screen.findByLabelText('Volumen de la música')
    expect(music).toHaveValue('80')
    expect(screen.getByText('<Keyboard>/space')).toBeInTheDocument()

    fireEvent.change(music, { target: { value: '35' } })
    await user.selectOptions(screen.getByLabelText('Idioma del juego'), 'en')
    await user.click(screen.getByLabelText('Pantalla completa'))
    await user.click(screen.getByRole('button', { name: 'Guardar configuración' }))

    expect(await screen.findByText('Configuración guardada.')).toBeInTheDocument()
    expect(await puts[0].json()).toEqual({
      musicVolume: 35, sfxVolume: 60, language: 'en', fullscreen: false, controls: settingsFixture.controls,
    })
  })
})

describe('seguridad', () => {
  it('cambia la contraseña y avisa que se cerraron los otros dispositivos', async () => {
    const user = userEvent.setup()
    const puts = spy('put', '/account/password', () => new HttpResponse(null, { status: 204 }))
    renderRoute('/app/account/security')

    await user.type(await screen.findByLabelText('Contraseña actual'), 'a-long-passphrase')
    await user.type(screen.getByLabelText('Contraseña nueva'), 'another-long-one')
    await user.type(screen.getByLabelText('Repite la contraseña nueva'), 'another-long-one')
    await user.click(screen.getByRole('button', { name: 'Cambiar contraseña' }))

    expect(await screen.findByText(/Contraseña actualizada/)).toBeInTheDocument()
    expect(await puts[0].json()).toEqual({ currentPassword: 'a-long-passphrase', newPassword: 'another-long-one' })
    expect(screen.getByLabelText('Contraseña actual')).toHaveValue('')
  })

  it('una contraseña actual incorrecta se marca en su campo y no cierra la sesión', async () => {
    const user = userEvent.setup()
    server.use(http.put(url('/account/password'), () => problem(401, 'INVALID_CREDENTIALS')))
    const { router } = renderRoute('/app/account/security')

    await user.type(await screen.findByLabelText('Contraseña actual'), 'wrong-password')
    await user.type(screen.getByLabelText('Contraseña nueva'), 'another-long-one')
    await user.type(screen.getByLabelText('Repite la contraseña nueva'), 'another-long-one')
    await user.click(screen.getByRole('button', { name: 'Cambiar contraseña' }))

    expect(await screen.findByText('La contraseña actual no es correcta.')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/app/account/security')
  })

  it('lista los dispositivos y cierra la sesión de otro', async () => {
    const user = userEvent.setup()
    let list = devicesFixture
    server.use(http.get(url('/account/devices'), () => HttpResponse.json(list)))
    const deletes = spy('delete', '/account/devices/:id', () => {
      list = devicesFixture.filter((d) => d.current)
      return new HttpResponse(null, { status: 204 })
    })
    renderRoute('/app/account/security')

    await screen.findByText('Este dispositivo')
    const devices = document.querySelector<HTMLElement>('[data-list="devices"]')!
    expect(within(devices).getAllByRole('listitem')).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: 'Cerrar sesión: Juego · PC' }))

    expect(await screen.findByText('No hay otros dispositivos con sesión.')).toBeInTheDocument()
    expect(new URL(deletes[0].url).pathname).toBe(`/api/v1/account/devices/${devicesFixture[1].id}`)
  })
})

describe('eliminar cuenta', () => {
  it('confirma la contraseña, elimina la cuenta y vuelve al inicio sin sesión', async () => {
    const user = userEvent.setup()
    const reauths = spy('post', '/auth/reauthenticate', () => HttpResponse.json(tokenFixture('access-fresh')))
    const deletes = spy('delete', '/account', () => new HttpResponse(null, { status: 204 }))
    const { router } = renderRoute('/app/account/delete')

    await user.type(await screen.findByLabelText('Confirma tu contraseña'), 'a-long-passphrase')
    await user.click(screen.getByLabelText(/Entiendo que se borra todo/))
    await user.click(screen.getByRole('button', { name: 'Eliminar mi cuenta' }))

    expect(await screen.findByText('Tu cuenta y todos sus datos se eliminaron.')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/')
    const nav = screen.getByRole('navigation', { name: 'Navegación principal' })
    expect(await within(nav).findByRole('link', { name: 'Iniciar sesión' })).toBeInTheDocument()

    expect(await reauths[0].json()).toEqual({ password: 'a-long-passphrase' })
    expect(reauths[0].headers.get('Authorization')).toBe('Bearer access-1')
    expect(deletes[0].headers.get('Authorization')).toBe('Bearer access-fresh') // token con auth_time reciente
  })

  it('sin marcar la casilla no llama a la API; una contraseña incorrecta no borra nada', async () => {
    const user = userEvent.setup()
    server.use(http.post(url('/auth/reauthenticate'), () => problem(401, 'INVALID_CREDENTIALS')))
    const deletes = spy('delete', '/account', () => new HttpResponse(null, { status: 204 }))
    const { router } = renderRoute('/app/account/delete')

    await user.type(await screen.findByLabelText('Confirma tu contraseña'), 'wrong-password')
    await user.click(screen.getByRole('button', { name: 'Eliminar mi cuenta' }))
    expect(await screen.findByText(/Marca la casilla/)).toBeInTheDocument()

    await user.click(screen.getByLabelText(/Entiendo que se borra todo/))
    await user.click(screen.getByRole('button', { name: 'Eliminar mi cuenta' }))

    expect(await screen.findByText('La contraseña no es correcta.')).toBeInTheDocument()
    expect(deletes).toHaveLength(0)
    expect(router.state.location.pathname).toBe('/app/account/delete')
  })
})