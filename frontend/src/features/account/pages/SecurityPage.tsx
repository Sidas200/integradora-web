import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { ApiError } from '@/shared/api/problems'
import { Button } from '@/shared/ui/Button'
import { PageHeader } from '@/shared/ui/PageHeader'
import { ErrorState } from '@/shared/ui/states'
import { TextField } from '@/shared/ui/TextField'
import { DevicesSection } from '../components/DevicesSection'
import { useChangePassword } from '../mutations'
import { passwordSchema, type PasswordFormInput, type PasswordFormOutput } from '../schemas'

export function SecurityPage() {
  const { t } = useTranslation()
  const change = useChangePassword()

  const form = useForm<PasswordFormInput, unknown, PasswordFormOutput>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })
  const { errors } = form.formState
  const message = (key?: string) => (key ? t(key as 'validation.required') : undefined)

  const onSubmit = form.handleSubmit((values) =>
    change.mutate(
      { currentPassword: values.currentPassword, newPassword: values.newPassword },
      {
        onSuccess: () => form.reset(),
        onError: (error) => {
          if (error instanceof ApiError && error.code === 'INVALID_CREDENTIALS') {
            form.setError('currentPassword', { message: 'account.security.wrongCurrent' })
            form.resetField('currentPassword', { keepError: true })
          }
        },
      },
    ),
  )

  const generalError = change.error instanceof ApiError && change.error.code !== 'INVALID_CREDENTIALS'
    ? change.error : null

  return (
    <section>
      <PageHeader title={t('pages.security')} />

      <section aria-labelledby="password-title">
        <h2 id="password-title">{t('account.security.passwordTitle')}</h2>
        <form onSubmit={(e) => void onSubmit(e)} noValidate data-form="password">
          <TextField
            label={t('account.security.currentPassword')}
            type="password"
            autoComplete="current-password"
            maxLength={72}
            error={message(errors.currentPassword?.message)}
            {...form.register('currentPassword')}
          />
          <TextField
            label={t('account.security.newPassword')}
            type="password"
            autoComplete="new-password"
            maxLength={72}
            hint={t('account.security.newPasswordHint')}
            error={message(errors.newPassword?.message)}
            {...form.register('newPassword')}
          />
          <TextField
            label={t('account.security.confirmPassword')}
            type="password"
            autoComplete="new-password"
            maxLength={72}
            error={message(errors.confirmPassword?.message)}
            {...form.register('confirmPassword')}
          />
          {generalError && <ErrorState error={generalError} />}
          <Button type="submit" loading={change.isPending}>
            {change.isPending ? t('account.security.saving') : t('account.security.save')}
          </Button>
        </form>
        {change.isSuccess && <p role="status">{t('account.security.saved')}</p>}
      </section>

      <DevicesSection />
    </section>
  )
}