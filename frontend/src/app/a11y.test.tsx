import { screen } from '@testing-library/react'
import axe from 'axe-core'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { renderRoute } from '@/test/renderRoute'
import { signedIn } from '@/test/session'

/** Runs axe on the whole document and returns the violations, readable in the test output. */
async function violations() {
  const result = await axe.run(document.body, {
    // jsdom does not lay out or paint: contrast is checked below from the tokens instead.
    rules: { 'color-contrast': { enabled: false } },
  })
  return result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)
}

describe('accesibilidad (axe)', () => {
  const pages: [string, string][] = [
    ['/', 'The Day I Made That Promise'],
    ['/news', 'Noticias'],
    ['/nosotros', 'Sobre Hex Studio'],
    ['/privacidad', 'Aviso de privacidad'],
    ['/login', 'Iniciar sesión'],
    ['/register', 'Crear cuenta'],
    ['/no-existe', 'Página no encontrada'],
  ]

  for (const [path, heading] of pages) {
    it(`${path} no tiene problemas de accesibilidad detectables`, { timeout: 20000 }, async () => {
      renderRoute(path)
      await screen.findByRole('heading', { level: 1, name: heading })
      expect(await violations()).toEqual([])
    })
  }

  it('/app (resumen del jugador) no tiene problemas de accesibilidad detectables', { timeout: 20000 }, async () => {
    signedIn()
    renderRoute('/app')
    await screen.findByTestId('greeting')
    expect(await violations()).toEqual([])
  })
})

// ---------- Contrast, from the design tokens ----------

const tokens = readFileSync(resolve('src/shared/styles/tokens.css'), 'utf8')

/** Hex colors of one theme block (":root {" for light, ':root[data-theme="dark"] {' for dark). */
function themeColors(selector: string): Record<string, string> {
  const start = tokens.indexOf(`${selector} {`)
  const block = tokens.slice(start, tokens.indexOf('\n}', start))
  return Object.fromEntries([...block.matchAll(/(--c-[a-z-]+):\s*(#[0-9A-Fa-f]{6})/g)].map((m) => [m[1]!, m[2]!]))
}

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi! + 0.05) / (lo! + 0.05)
}

describe('contraste de colores (WCAG AA)', () => {
  // Text and the background it sits on; the background is the solid fallback of the glass panels.
  const pairs: [string, string][] = [
    ['--c-text', '--c-glass-solid'],
    ['--c-text-muted', '--c-glass-solid'],
    ['--c-primary', '--c-glass-solid'],
    ['--c-on-primary', '--c-primary'],
    ['--c-on-promise', '--c-promise'],
    ['--c-error', '--c-glass-solid'],
    ['--c-success', '--c-glass-solid'],
  ]

  for (const [theme, selector] of [['claro', ':root'], ['oscuro', ':root[data-theme="dark"]']] as const) {
    it(`tema ${theme}: el texto llega al menos a 4.5:1`, () => {
      const colors = { ...themeColors(':root'), ...themeColors(selector) }
      for (const [fg, bg] of pairs) {
        if (!colors[fg] || !colors[bg]) continue
        expect(contrast(colors[fg], colors[bg]), `${fg} sobre ${bg}`).toBeGreaterThanOrEqual(4.5)
      }
    })
  }
})

// ---------- Reduced motion ----------

function cssFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? cssFiles(path) : path.endsWith('.css') ? [path] : []
  })
}

describe('movimiento reducido', () => {
  it('global.css apaga animaciones y transiciones con prefers-reduced-motion', () => {
    const global = readFileSync(resolve('src/shared/styles/global.css'), 'utf8')
    const block = global.slice(global.indexOf('@media (prefers-reduced-motion: reduce)'))
    expect(block).toMatch(/animation-duration: 1ms !important/)
    expect(block).toMatch(/transition-duration: 1ms !important/)
  })

  it('las animaciones ligadas al scroll (que no dependen de la duración) tienen su propio bloque', () => {
    const missing = cssFiles(resolve('src'))
      .filter((file) => readFileSync(file, 'utf8').includes('animation-timeline'))
      .filter((file) => !readFileSync(file, 'utf8').includes('prefers-reduced-motion'))
    expect(missing).toEqual([])
  })
})
