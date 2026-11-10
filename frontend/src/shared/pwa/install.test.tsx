import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import '@/shared/i18n/i18n'
import { InstallButton } from './InstallButton'
import { getInstallKind, listenForInstall, resetInstallForTests } from './install'

/** A beforeinstallprompt like Chromium's: prompt() opens the dialog and userChoice says what the player chose. */
function offerInstall(outcome: 'accepted' | 'dismissed' = 'accepted') {
  const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
    prompt: vi.fn(() => Promise.resolve()),
    userChoice: Promise.resolve({ outcome }),
  })
  act(() => {
    window.dispatchEvent(event)
  })
  return event
}

function setUserAgent(value: string, touchPoints = 0) {
  vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(value)
  // jsdom has no maxTouchPoints; an own property on navigator stands in for it during the test
  Object.defineProperty(window.navigator, 'maxTouchPoints', { value: touchPoints, configurable: true })
}

beforeAll(() => listenForInstall())

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  Reflect.deleteProperty(window.navigator, 'maxTouchPoints')
  act(() => resetInstallForTests())
})

describe('botón Instalar app', () => {
  it('no aparece si el navegador no ofrece instalar', () => {
    render(<InstallButton />)
    expect(screen.queryByRole('button', { name: 'Instalar app' })).not.toBeInTheDocument()
  })

  it('aparece con beforeinstallprompt, abre el diálogo del navegador y se oculta al aceptar', async () => {
    const user = userEvent.setup()
    render(<InstallButton />)
    const event = offerInstall('accepted')

    expect(event.defaultPrevented).toBe(true) // no mini-infobar: the app shows its own button
    await user.click(screen.getByRole('button', { name: 'Instalar app' }))

    expect(event.prompt).toHaveBeenCalledOnce()
    expect(screen.queryByRole('button', { name: 'Instalar app' })).not.toBeInTheDocument()
  })

  it('si el jugador cancela, el evento ya no sirve y el botón se oculta hasta que el navegador lo ofrezca otra vez', async () => {
    const user = userEvent.setup()
    render(<InstallButton />)
    offerInstall('dismissed')

    await user.click(screen.getByRole('button', { name: 'Instalar app' }))
    expect(screen.queryByRole('button', { name: 'Instalar app' })).not.toBeInTheDocument()

    offerInstall()
    expect(screen.getByRole('button', { name: 'Instalar app' })).toBeInTheDocument()
  })

  it('desaparece cuando la app se instala desde el menú del navegador', () => {
    render(<InstallButton />)
    offerInstall()
    expect(screen.getByRole('button', { name: 'Instalar app' })).toBeInTheDocument()

    act(() => {
      window.dispatchEvent(new Event('appinstalled'))
    })
    expect(screen.queryByRole('button', { name: 'Instalar app' })).not.toBeInTheDocument()
    expect(getInstallKind()).toBe('installed')
  })

  it.each([
    ['iPhone', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1', 0],
    ['iPad (se presenta como Mac)', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15', 5],
  ])('en %s explica cómo agregarla a inicio', async (_, ua, touch) => {
    const user = userEvent.setup()
    setUserAgent(ua, touch)
    render(<InstallButton />)

    const button = screen.getByRole('button', { name: 'Instalar app' })
    const steps = screen.getByText('En iPhone o iPad: toca Compartir y luego «Agregar a inicio».')
    expect(steps).not.toBeVisible()
    expect(button).toHaveAttribute('aria-expanded', 'false')

    await user.click(button)
    expect(steps).toBeVisible()
    expect(button).toHaveAttribute('aria-expanded', 'true')
  })

  it('una Mac de escritorio no es iOS', () => {
    setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15', 0)
    expect(getInstallKind()).toBe('unavailable')
  })

  it('abierta como app instalada no ofrece instalar', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query === '(display-mode: standalone)' }))
    render(<InstallButton />)
    offerInstall()

    expect(getInstallKind()).toBe('installed')
    expect(screen.queryByRole('button', { name: 'Instalar app' })).not.toBeInTheDocument()
  })
})