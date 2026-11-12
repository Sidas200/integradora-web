import { describe, expect, it, vi } from 'vitest'
import { ApiError, type Problem } from '@/shared/api/problems'
import { applyServerErrors } from './serverErrors'

type Form = { email: string; username: string; password: string; acceptedPrivacyNotice: boolean }
const FIELDS = ['email', 'username', 'password', 'acceptedPrivacyNotice'] as const

const problem = (code: Problem['code'], status: number, errors: Problem['errors'] = []): ApiError =>
  new ApiError(code, status, { type: 'about:blank', title: code, status, code, errors })

describe('errores de la API en el formulario', () => {
  it('marca cada campo que la API rechazó con su mensaje', () => {
    const setError = vi.fn()
    const result = applyServerErrors<Form>(problem('VALIDATION_FAILED', 400, [
      { field: 'email', code: 'Email', message: 'x' },
      { field: 'password', code: 'Size', message: 'x' },
      { field: 'acceptedPrivacyNotice', code: 'AssertTrue', message: 'x' },
    ]), setError, FIELDS)

    expect(result).toBeNull()
    expect(setError).toHaveBeenCalledWith('email', { message: 'validation.email' })
    expect(setError).toHaveBeenCalledWith('password', { message: 'validation.passwordLength' })
    expect(setError).toHaveBeenCalledWith('acceptedPrivacyNotice', { message: 'validation.privacy' })
  })

  it.each([
    ['email', 'errors.EMAIL_IN_USE'],
    ['username', 'errors.USERNAME_IN_USE'],
  ])('un %s repetido (409 IN_USE) dice que ya existe', (field, message) => {
    const setError = vi.fn()
    applyServerErrors<Form>(problem(field === 'email' ? 'EMAIL_IN_USE' : 'USERNAME_IN_USE', 409, [
      { field, code: 'IN_USE', message: 'x' },
    ]), setError, FIELDS)

    expect(setError).toHaveBeenCalledWith(field, { message })
  })

  it('un campo que este formulario no tiene no se marca y queda el mensaje general', () => {
    const setError = vi.fn()
    const result = applyServerErrors<Pick<Form, 'email'>>(problem('VALIDATION_FAILED', 400, [
      { field: 'username', code: 'Pattern', message: 'x' },
      { field: 'unknown', code: 'X', message: 'x' },
    ]), setError, ['email'])

    expect(setError).not.toHaveBeenCalled()
    expect(result).toBe('VALIDATION_FAILED')
  })

  it.each(['INVALID_CREDENTIALS', 'TOO_MANY_ATTEMPTS', 'INTERNAL_ERROR'] as const)('%s es un mensaje general', (code) => {
    const setError = vi.fn()
    expect(applyServerErrors<Form>(problem(code, 401), setError, FIELDS)).toBe(code)
    expect(setError).not.toHaveBeenCalled()
  })

  it('sin red es NETWORK_ERROR y algo que no es de la API es UNKNOWN', () => {
    expect(applyServerErrors<Form>(new ApiError('NETWORK_ERROR', null, null), vi.fn(), FIELDS)).toBe('NETWORK_ERROR')
    expect(applyServerErrors<Form>(new Error('boom'), vi.fn(), FIELDS)).toBe('UNKNOWN')
  })
})