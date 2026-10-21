import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { ApiError } from '@/shared/api/problems'
import { usePwaState } from '@/shared/pwa'
import { Button } from '@/shared/ui/Button'
import { CheckboxField } from '@/shared/ui/CheckboxField'
import { SelectField } from '@/shared/ui/SelectField'
import { TextField } from '@/shared/ui/TextField'
import { useSubscribe } from '../mutations'
import { subscribeSchema, type SubscribeFormInput, type SubscribeFormOutput } from '../schemas'

type ValidationKey = 'validation.required' | 'validation.email' | 'validation.consent'

/** Server field errors (400) mapped to the same keys the client schema uses. */
const SERVER_FIELD_MESSAGES: Record<string, ValidationKey> = {
  email: 'validation.email',
  consent: 'validation.consent',
}

export function SubscribeForm() {
  const { t } = useTranslation()
  const { lastMessage } = usePwaState()
  const subscribe = useSubscribe()

  const form = useForm<SubscribeFormInput, unknown, SubscribeFormOutput>({
    resolver: zodResolver(subscribeSchema),
    defaultValues: { email: '', language: 'es', consent: false },
  })
  const { errors } = form.formState
  const message = (key?: string) => (key ? t(key as ValidationKey) : undefined)

  const onSubmit = form.handleSubmit((values) =>
    subscribe.mutate(
      { email: values.email.toLowerCase(), language: values.language, consent: true },
      {
        onSuccess: (outcome) => {
          if (outcome === 'SENT') form.reset()
        },
        onError: (error) => {
          if (!(error instanceof ApiError)) return
          for (const { field } of error.fieldErrors) {
            const key = SERVER_FIELD_MESSAGES[field]
            if (key) form.setError(field as 'email' | 'consent', { message: key })
          }
        },
      },
    ),
  )

  // Derived while rendering: a queued request that the Service Worker already sent.
  const synced = subscribe.data === 'QUEUED' && lastMessage?.type === 'SUBSCRIPTION_SENT'
  const result =
    synced ? { kind: 'sent', text: t('subscribe.synced') }
    : subscribe.data === 'SENT' ? { kind: 'sent', text: t('subscribe.sent') }
    : subscribe.data === 'QUEUED' ? { kind: 'queued', text: t('subscribe.queued') }
    : subscribe.error ? { kind: 'error', text: t(`errors.${(subscribe.error as ApiError).code ?? 'UNKNOWN'}`) }
    : null

  return (
    <section aria-labelledby="subscribe-title" id="subscribe">
      <h2 id="subscribe-title">{t('subscribe.title')}</h2>
      <form onSubmit={(e) => void onSubmit(e)} noValidate>
        <TextField
          label={t('subscribe.email')}
          type="email"
          autoComplete="email"
          maxLength={254}
          placeholder={t('subscribe.emailPlaceholder')}
          error={message(errors.email?.message)}
          {...form.register('email')}
        />
        <SelectField
          label={t('subscribe.language')}
          options={[
            { value: 'es', label: t('subscribe.languages.es') },
            { value: 'en', label: t('subscribe.languages.en') },
          ]}
          {...form.register('language')}
        />
        <CheckboxField
          label={t('subscribe.consent')}
          error={message(errors.consent?.message)}
          {...form.register('consent')}
        />
        <Button type="submit" variant="promise" loading={subscribe.isPending}>
          {subscribe.isPending ? t('subscribe.sending') : t('subscribe.submit')}
        </Button>
      </form>
      {result && (
        <p role="status" data-kind={result.kind} data-testid="subscribe-result">{result.text}</p>
      )}
    </section>
  )
}