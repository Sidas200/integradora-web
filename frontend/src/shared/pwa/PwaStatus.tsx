import { useCallback, useEffect, useState } from 'react'
import { usePwaState } from './registerSW'
import { useOnline } from './useOnline'
import { log, logTable } from '../lab/logger'
import css from './pwa.module.css'

type Snapshot = {
  sw: string
  controlled: boolean
  caches: { name: string; entries: number }[]
  queued: number
}

async function countQueued(): Promise<number> {
  const dbs = (await indexedDB.databases?.()) ?? []
  if (!dbs.some((d) => d.name === 'workbox-background-sync')) return 0
  return new Promise((resolve) => {
    const open = indexedDB.open('workbox-background-sync')
    open.onerror = () => resolve(0)
    open.onsuccess = () => {
      const db = open.result
      if (!db.objectStoreNames.contains('requests')) return resolve(0)
      const count = db.transaction('requests').objectStore('requests').count()
      count.onsuccess = () => {
        resolve(count.result)
        db.close()
      }
      count.onerror = () => resolve(0)
    }
  })
}

async function snapshot(): Promise<Snapshot> {
  const reg = await navigator.serviceWorker?.getRegistration()
  const worker = reg?.active ?? reg?.waiting ?? reg?.installing
  const names = 'caches' in window ? await caches.keys() : []
  const list = await Promise.all(
    names.map(async (name) => ({ name, entries: (await (await caches.open(name)).keys()).length })),
  )
  return {
    sw: worker ? worker.state : 'sin registrar',
    controlled: Boolean(navigator.serviceWorker?.controller),
    caches: list,
    queued: await countQueued(),
  }
}

export function PwaStatus() {
  const online = useOnline()
  const { lastMessage, offlineReady } = usePwaState()
  const [snap, setSnap] = useState<Snapshot | null>(null)

  const refresh = useCallback(async () => {
    const s = await snapshot()
    setSnap(s)
    log('pwa', `SW=${s.sw} · controla la página=${s.controlled} · cola Background Sync=${s.queued}`)
    logTable('pwa', 'Cache Storage', s.caches)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh, online, lastMessage, offlineReady])

  useEffect(() => {
    const id = setInterval(() => void snapshot().then(setSnap), 5000)
    return () => clearInterval(id)
  }, [])

  if (!snap) return null
  return (
    <aside className={css.status} aria-label="Estado de la PWA">
      <h2>Estado de la PWA</h2>
      <dl>
        <dt>Red</dt>
        <dd data-ok={online}>{online ? 'En línea' : 'Sin conexión'}</dd>
        <dt>Service Worker</dt>
        <dd data-ok={snap.sw === 'activated'}>{snap.sw}{snap.controlled ? ' · controla esta página' : ''}</dd>
        <dt>Cola de envío (IndexedDB)</dt>
        <dd data-ok={snap.queued === 0}>{snap.queued === 0 ? 'Vacía' : `${snap.queued} pendiente(s)`}</dd>
        <dt>Cache Storage</dt>
        <dd>
          {snap.caches.length === 0
            ? '—'
            : snap.caches.map((c) => `${c.name.replace(/-v2-.*$/, '')} (${c.entries})`).join(' · ')}
        </dd>
      </dl>
      <button type="button" onClick={() => void refresh()}>Actualizar estado</button>
    </aside>
  )
}
