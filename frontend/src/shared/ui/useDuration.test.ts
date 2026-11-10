import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useDuration } from './useDuration'

describe('useDuration', () => {
  it.each([
    [0, '0 min'],
    [59, '0 min'],
    [1680, '28 min'],
    [3599, '59 min'],
    [3600, '1 h 0 min'],
    [6720, '1 h 52 min'],
    [11520, '3 h 12 min'],
    [90000, '25 h 0 min'],
  ])('%i s → %s', (seconds, text) => {
    const { result } = renderHook(() => useDuration())
    expect(result.current(seconds)).toBe(text)
  })
})