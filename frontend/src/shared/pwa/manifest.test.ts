import { matchRoutes, type RouteObject } from 'react-router'
import { describe, expect, it } from 'vitest'
import { createRoutes } from '@/app/routes'
import { manifest } from './manifest'

const routes: RouteObject[] = createRoutes({ lab: false })
/** True when the path reaches a real screen, not the catch-all 404. */
const exists = (url: string) => {
  const matches = matchRoutes(routes, new URL(url, 'https://tdimp.app').pathname) ?? []
  return matches.length > 0 && matches.at(-1)?.route.path !== '*'
}

describe('manifiesto', () => {
  it('cada atajo abre una pantalla que existe', () => {
    expect(manifest.shortcuts?.map((s) => s.name)).toEqual(['Historial', 'Logros'])
    for (const shortcut of manifest.shortcuts ?? []) {
      expect(exists(shortcut.url), shortcut.url).toBe(true)
      expect(shortcut.icons?.length).toBeGreaterThan(0)
    }
  })

  it('arranca dentro de su alcance, en el panel del jugador', () => {
    expect(manifest.start_url?.startsWith(manifest.scope ?? '/')).toBe(true)
    expect(exists(manifest.start_url ?? '')).toBe(true)
  })

  it('tiene los íconos que pide la instalación (192, 512 y maskable)', () => {
    const icons = manifest.icons ?? []
    expect(icons.map((i) => i.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']))
    expect(icons.some((i) => i.purpose === 'maskable')).toBe(true)
  })
})