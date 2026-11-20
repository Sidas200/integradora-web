import { describe, expect, it } from 'vitest'
import { deleteSchema, passwordSchema, profileSchema, settingsSchema } from '@/features/account/schemas'
import { loginSchema, registerSchema } from '@/features/auth/schemas'
import { subscribeSchema } from '@/features/landing/schemas'

/**
 * The forms validate with the same limits as the backend DTOs and the CHECKs of the database, so
 * the player sees the error before sending. Each case returns the i18n key the form will show.
 */
const issues = (result: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }) =>
  Object.fromEntries((result.error?.issues ?? []).map((i) => [i.path.join('.'), i.message]))

const validRegister = {
  email: 'felc@example.com', username: 'Felc_2', password: 'a-long-passphrase',
  confirmPassword: 'a-long-passphrase', acceptedPrivacyNotice: true,
}

describe('correo (login, registro, aviso de lanzamiento)', () => {
  it.each([
    ['', 'validation.required'],
    ['   ', 'validation.required'],
    ['no-es-correo', 'validation.email'],
    [`${'a'.repeat(245)}@example.com`, 'validation.email'], // 257 > 254
  ])('%j → %s', (email, message) => {
    expect(issues(loginSchema.safeParse({ email, password: 'x' })).email).toBe(message)
    expect(issues(subscribeSchema.safeParse({ email, language: 'es', consent: true })).email).toBe(message)
  })

  it('quita los espacios de alrededor', () => {
    expect(loginSchema.parse({ email: '  felc@example.com ', password: 'x' }).email).toBe('felc@example.com')
  })
})

describe('registro', () => {
  it('acepta un registro válido', () => {
    expect(registerSchema.safeParse(validRegister).success).toBe(true)
  })

  it.each([
    ['ab', false], ['abc', true], ['a'.repeat(20), true], ['a'.repeat(21), false],
    ['con espacio', false], ['ñandú', false], ['Felc_2', true],
  ])('nombre de jugador %j válido: %s', (username, valid) => {
    expect(issues(registerSchema.safeParse({ ...validRegister, username })).username).toBe(valid ? undefined : 'validation.username')
  })

  it.each([[7, false], [8, true], [72, true], [73, false]])('contraseña de %i caracteres válida: %s', (length, valid) => {
    const password = 'x'.repeat(length)
    const result = issues(registerSchema.safeParse({ ...validRegister, password, confirmPassword: password }))
    expect(result.password).toBe(valid ? undefined : 'validation.passwordLength')
  })

  it('las contraseñas deben coincidir y el aviso de privacidad es obligatorio', () => {
    const result = issues(registerSchema.safeParse({ ...validRegister, confirmPassword: 'otra-cosa', acceptedPrivacyNotice: false }))
    expect(result).toMatchObject({ confirmPassword: 'validation.passwordMatch', acceptedPrivacyNotice: 'validation.privacy' })
  })

  it('el login no pide mínimo (una cuenta antigua puede tener otra regla) pero sí el máximo de bcrypt', () => {
    expect(loginSchema.safeParse({ email: 'felc@example.com', password: 'x' }).success).toBe(true)
    expect(issues(loginSchema.safeParse({ email: 'felc@example.com', password: 'x'.repeat(73) })).password).toBe('validation.passwordLength')
  })
})

describe('cuenta', () => {
  it('el nombre de jugador sigue la misma regla que en el registro', () => {
    expect(profileSchema.safeParse({ username: ' Felc_2 ' }).success).toBe(true)
    expect(issues(profileSchema.safeParse({ username: 'no' })).username).toBe('validation.username')
  })

  it('la contraseña nueva debe ser distinta de la actual y coincidir con la confirmación', () => {
    expect(issues(passwordSchema.safeParse({ currentPassword: 'a-long-passphrase', newPassword: 'a-long-passphrase', confirmPassword: 'a-long-passphrase' })))
      .toEqual({ newPassword: 'validation.newPasswordSame' })
    expect(issues(passwordSchema.safeParse({ currentPassword: 'old', newPassword: 'new-passphrase', confirmPassword: 'otra' })))
      .toEqual({ confirmPassword: 'validation.passwordMatch' })
    expect(issues(passwordSchema.safeParse({ currentPassword: '', newPassword: 'corta', confirmPassword: 'corta' })))
      .toMatchObject({ currentPassword: 'validation.required', newPassword: 'validation.passwordLength' })
  })

  it.each([[-1, false], [0, true], [100, true], [101, false], [50.5, false], [Number.NaN, false]])('volumen %d válido: %s', (musicVolume, valid) => {
    const result = settingsSchema.safeParse({ musicVolume, sfxVolume: 50, language: 'es', fullscreen: false })
    expect(issues(result).musicVolume).toBe(valid ? undefined : 'validation.volume')
  })

  it('el idioma del juego es es o en', () => {
    expect(settingsSchema.safeParse({ musicVolume: 1, sfxVolume: 1, language: 'fr', fullscreen: false }).success).toBe(false)
  })

  it('eliminar la cuenta pide la contraseña y marcar la casilla', () => {
    expect(issues(deleteSchema.safeParse({ password: '', confirm: false })))
      .toEqual({ password: 'validation.required', confirm: 'validation.confirmDeletion' })
    expect(deleteSchema.safeParse({ password: 'x', confirm: true }).success).toBe(true)
  })
})

describe('aviso de lanzamiento', () => {
  it('el consentimiento es obligatorio y el idioma es es o en', () => {
    expect(issues(subscribeSchema.safeParse({ email: 'a@example.com', language: 'es', consent: false })).consent).toBe('validation.consent')
    expect(subscribeSchema.safeParse({ email: 'a@example.com', language: 'de', consent: true }).success).toBe(false)
  })
})