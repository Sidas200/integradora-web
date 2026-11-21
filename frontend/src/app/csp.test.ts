import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// Vitest runs from frontend/
const vercel = readFileSync(resolve('vercel.ts'), 'utf8')
const nginx = readFileSync(resolve('nginx/default.conf.template'), 'utf8')

/** Directives as written in vercel.ts ("default-src 'self'", ...). */
const vercelDirectives = [...vercel.matchAll(/^\s+"([a-z-]+ [^"]+)",?$/gm)].map((m) => m[1]!)
const nginxPolicy = /set \$csp "([^"]+)";/.exec(nginx)?.[1] ?? ''

describe('política de seguridad de contenido (CSP)', () => {
  it('vercel.ts declara una CSP estricta: sin scripts en línea ni orígenes externos', () => {
    expect(vercelDirectives).toContain("script-src 'self'")
    expect(vercelDirectives).toContain("object-src 'none'")
    expect(vercelDirectives).toContain("frame-ancestors 'none'")
    expect(vercelDirectives.join('; ')).not.toMatch(/unsafe-eval|https?:/)
    expect(vercel).toContain("routes.header('/(.*)', SECURITY_HEADERS)")
  })

  it('nginx manda exactamente la misma política que Vercel', () => {
    expect(nginxPolicy.split('; ')).toEqual(vercelDirectives)
    expect(nginx).toContain('add_header Content-Security-Policy $csp always;')
  })
})
