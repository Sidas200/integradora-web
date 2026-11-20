import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PwaStatus } from './PwaStatus'
import { setPwaState } from './pwaState'

/** Cache Storage with the given caches and number of entries each. */
function fakeCaches(content: Record<string, number>) {
  vi.stubGlobal('caches', {
    keys: async () => Object.keys(content),
    open: async (name: string) => ({ keys: async () => Array.from({ length: content[name] ?? 0 }) }),
  })
}

function fakeServiceWorker(state: ServiceWorkerState | null, controlled: boolean) {
  Object.defineProperty(window.navigator, 'serviceWorker', {
    configurable: true,
    value: {
      controller: controlled ? {} : null,
      getRegistration: async () => (state ? { active: { state } } : undefined),
    },
  })
}

/** Requests waiting in the Background Sync queue (same database and store as Workbox). */
async function queueRequests(count: number) {
  await new Promise<void>((resolve, reject) => {
    const open = indexedDB.open('workbox-background-sync', 1)
    open.onupgradeneeded = () => open.result.createObjectStore('requests', { autoIncrement: true })
    open.onerror = () => reject(open.error)
    open.onsuccess = () => {
      const tx = open.result.transaction('requests', 'readwrite')
      for (let i = 0; i < count; i++) tx.objectStore('requests').add({ i })
      tx.oncomplete = () => {
        open.result.close()
        resolve()
      }
    }
  })
}

async function deleteQueue() {
  await new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase('workbox-background-sync')
    request.onsuccess = () => resolve()
    request.onerror = () => resolve()
  })
}

afterEach(async () => {
  vi.unstubAllGlobals()
  Reflect.deleteProperty(window.navigator, 'serviceWorker')
  act(() => setPwaState({ needRefresh: false, offlineReady: false, lastMessage: null }))
  await deleteQueue()
})

describe('panel de estado de la PWA (/lab)', () => {
  it('muestra Service Worker, cachés y cola de envío', async () => {
    fakeServiceWorker('activated', true)
    fakeCaches({ 'workbox-precache-v2-https://tdimp.app/': 44, 'public-api': 3 })
    await queueRequests(2)
    render(<PwaStatus />)

    const panel = await screen.findByRole('complementary', { name: 'Estado de la PWA' })
    expect(panel).toHaveTextContent('activated · controla esta página')
    expect(panel).toHaveTextContent('workbox-precache (44) · public-api (3)')
    expect(await screen.findByText('2 pendiente(s)')).toHaveAttribute('data-ok', 'false')
  })

  it('sin Service Worker ni cachés lo dice', async () => {
    fakeCaches({})
    render(<PwaStatus />)

    expect(await screen.findByText('sin registrar')).toHaveAttribute('data-ok', 'false')
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.getByText('Vacía')).toHaveAttribute('data-ok', 'true')
  })

  it('"Actualizar estado" vuelve a leerlo', async () => {
    const user = userEvent.setup()
    fakeServiceWorker('installed', false)
    fakeCaches({})
    render(<PwaStatus />)
    expect(await screen.findByText('installed')).toBeInTheDocument()

    fakeServiceWorker('activated', true)
    await user.click(screen.getByRole('button', { name: 'Actualizar estado' }))

    expect(await screen.findByText('activated · controla esta página')).toBeInTheDocument()
  })

  it('se vuelve a leer cuando llega un mensaje del Service Worker', async () => {
    fakeCaches({})
    render(<PwaStatus />)
    await screen.findByText('Vacía')

    await queueRequests(1)
    act(() => setPwaState({ lastMessage: { type: 'SUBSCRIPTION_QUEUED' } }))

    expect(await screen.findByText('1 pendiente(s)')).toBeInTheDocument()
  })
})