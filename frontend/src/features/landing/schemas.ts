import { z } from 'zod'

/**
 * Same rules as SubscriptionRequest in the backend (email ≤ 254, es|en, consent = true).
 * Messages are i18n keys; the form translates them.
 */
export const subscribeSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { error: 'validation.required' })
    .max(254, { error: 'validation.email' })
    .pipe(z.email({ error: 'validation.email' })),
  language: z.enum(['es', 'en']),
  consent: z.boolean().refine((accepted) => accepted, { error: 'validation.consent' }),
})

export type SubscribeFormInput = z.input<typeof subscribeSchema>
export type SubscribeFormOutput = z.output<typeof subscribeSchema>