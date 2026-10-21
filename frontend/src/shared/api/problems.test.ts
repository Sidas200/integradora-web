import { describe, expect, it } from 'vitest'
import { ApiError, toApiError, type Problem } from './problems'

describe('toApiError', () => {
  it('conserva el code y los errores por campo de un Problem de la API', () => {
    const problem: Problem = {
      type: 'https://tdimp.app/problems/validation-failed',
      title: 'Validation failed',
      status: 400,
      code: 'VALIDATION_FAILED',
      errors: [{ field: 'username', code: 'Pattern', message: 'Must be 3 to 20 letters.' }],
    }

    const error = toApiError(problem)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe('VALIDATION_FAILED')
    expect(error.status).toBe(400)
    expect(error.fieldErrors[0]?.field).toBe('username')
  })

  it('un fetch sin red (TypeError) es NETWORK_ERROR', () => {
    expect(toApiError(new TypeError('Failed to fetch')).code).toBe('NETWORK_ERROR')
  })

  it('cualquier otra cosa es UNKNOWN y guarda el status si lo hay', () => {
    const error = toApiError(undefined, 502)
    expect(error.code).toBe('UNKNOWN')
    expect(error.status).toBe(502)
  })
})