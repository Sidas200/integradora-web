import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { OfflineBanner } from './OfflineBanner'
import { setPwaState, setUpdater } from './pwaState'
import { UpdatePrompt } from './UpdatePrompt'

afterEach(() => {
  act(() => setPwaState({ needRefresh: false, offlineReady: false, lastMessage: null }))
  vi.restoreAllMocks()
})

describe('aviso de versión nueva', () => {
  it('no aparece mientras no haya una versión esperando', () => {
    render(<UpdatePrompt />)
    expect(screen.queryByRole('button', { name: 'Actualizar' })).not.toBeInTheDocument()
  })

  it('aparece con una versión nueva y solo actualiza cuando el jugador lo pide', async () => {
    const user = userEvent.setup()
    const updater = vi.fn(async () => {})
    setUpdater(updater)
    render(<UpdatePrompt />)

    act(() => setPwaState({ needRefresh: true }))
    expect(screen.getByRole('status')).toHaveTextContent('Hay una versión nueva de la app.')
    expect(updater).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Actualizar' }))
    expect(updater).toHaveBeenCalledWith(true)
  })
})

describe('aviso sin conexión', () => {
  let onLine: MockInstance<() => boolean>
  const setOnline = (value: boolean) => {
    onLine.mockReturnValue(value)
    act(() => {
      window.dispatchEvent(new Event(value ? 'online' : 'offline'))
    })
  }

  it('aparece al perder la red y se va al volver', () => {
    onLine = vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(true)
    render(<OfflineBanner />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    setOnline(false)
    expect(screen.getByRole('status')).toHaveTextContent('Sin conexión.')

    setOnline(true)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})