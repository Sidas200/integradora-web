import { describe, expect, it } from 'vitest'
import { latestSave, parseSlot } from './slots'

describe('parseSlot', () => {
  it.each(['1', '2', '3'])('acepta la ranura %s', (value) => {
    expect(parseSlot(value)).toBe(Number(value))
  })

  it.each([undefined, '', '0', '4', '01', '1.0', ' 1', 'abc', '-1'])('rechaza %j', (value) => {
    expect(parseSlot(value)).toBeNull()
  })
})

describe('latestSave', () => {
  it('elige la ranura guardada más recientemente sin importar el orden', () => {
    const saves = [
      { slot: 1, updatedAt: '2026-10-05T18:00:00Z' },
      { slot: 2, updatedAt: '2026-10-20T18:00:00Z' },
      { slot: 3, updatedAt: '2026-10-10T18:00:00Z' },
    ]
    expect(latestSave(saves)?.slot).toBe(2)
  })

  it('sin partidas no hay última', () => {
    expect(latestSave([])).toBeUndefined()
  })
})