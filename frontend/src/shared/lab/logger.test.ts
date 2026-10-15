import { describe, expect, it } from 'vitest'
import { formatBytes } from './logger'

describe('formatBytes', () => {
  it('muestra bytes por debajo de 1 KB', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(1023)).toBe('1023 B')
  })

  it('muestra KB con un decimal desde 1024 bytes', () => {
    expect(formatBytes(1024)).toBe('1.0 KB')
    expect(formatBytes(1536)).toBe('1.5 KB')
  })
})
