import { z } from 'zod'

/**
 * Same rules as LoginRequest / RegisterRequest in the backend and the CHECKs of game.players.
 * Messages are i18n keys; the forms translate them.
 */
const email = z
  .string()
  .trim()
  .min(1, { error: 'validation.required' })
  .max(254, { error: 'validation.email' })
  .pipe(z.email({ error: 'validation.email' }))

export const loginSchema = z.object({
  email,
  password: z.string().min(1, { error: 'validation.required' }).max(72, { error: 'validation.passwordLength' }),
})

export const registerSchema = z
  .object({
    email,
    username: z.string().trim().regex(/^[A-Za-z0-9_]{3,20}$/, { error: 'validation.username' }),
    password: z.string().min(8, { error: 'validation.passwordLength' }).max(72, { error: 'validation.passwordLength' }),
    confirmPassword: z.string(),
    acceptedPrivacyNotice: z.boolean().refine((accepted) => accepted, { error: 'validation.privacy' }),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ['confirmPassword'], error: 'validation.passwordMatch' })

export type LoginFormInput = z.input<typeof loginSchema>
export type LoginFormOutput = z.output<typeof loginSchema>
export type RegisterFormInput = z.input<typeof registerSchema>
export type RegisterFormOutput = z.output<typeof registerSchema>