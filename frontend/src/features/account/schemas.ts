import { z } from 'zod'

/** Same rules as the backend DTOs (UpdateAccountRequest, ChangePasswordRequest, SettingsDto). Messages are i18n keys. */

export const profileSchema = z.object({
  username: z.string().trim().regex(/^[A-Za-z0-9_]{3,20}$/, { error: 'validation.username' }),
})

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, { error: 'validation.required' }).max(72, { error: 'validation.passwordLength' }),
    newPassword: z.string().min(8, { error: 'validation.passwordLength' }).max(72, { error: 'validation.passwordLength' }),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { path: ['confirmPassword'], error: 'validation.passwordMatch' })
  .refine((v) => v.newPassword !== v.currentPassword, { path: ['newPassword'], error: 'validation.newPasswordSame' })

const volume = z.number({ error: 'validation.volume' }).int({ error: 'validation.volume' })
  .min(0, { error: 'validation.volume' }).max(100, { error: 'validation.volume' })

export const settingsSchema = z.object({
  musicVolume: volume,
  sfxVolume: volume,
  language: z.enum(['es', 'en']),
  fullscreen: z.boolean(),
})

export const deleteSchema = z.object({
  password: z.string().min(1, { error: 'validation.required' }).max(72, { error: 'validation.passwordLength' }),
  confirm: z.boolean().refine((accepted) => accepted, { error: 'validation.confirmDeletion' }),
})

export type ProfileForm = z.infer<typeof profileSchema>
export type PasswordFormInput = z.input<typeof passwordSchema>
export type PasswordFormOutput = z.output<typeof passwordSchema>
export type SettingsForm = z.infer<typeof settingsSchema>
export type DeleteForm = z.infer<typeof deleteSchema>