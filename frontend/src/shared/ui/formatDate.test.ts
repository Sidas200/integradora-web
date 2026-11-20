import { describe, expect, it } from 'vitest'
import { formatDateTime, formatLongDate } from './formatDate'

// 18:00 UTC is the same calendar day in Mexico (UTC-6) and in CI (UTC), so the date never shifts.
const ISO = '2026-10-20T18:00:00Z'

describe('fechas', () => {
  it('formato largo en español de México', () => {
    expect(formatLongDate(ISO)).toBe('20 de octubre de 2026')
  })

  it('fecha con hora para sesiones e historial', () => {
    const text = formatDateTime(ISO)
    expect(text).toMatch(/^20 oct\.? 2026/) // some ICU versions add the period
    expect(text).toMatch(/\d{1,2}:\d{2}/)
  })

  it('una fecha inválida lanza RangeError (la API siempre manda ISO-8601)', () => {
    expect(() => formatLongDate('no-es-fecha')).toThrow(RangeError)
  })
})