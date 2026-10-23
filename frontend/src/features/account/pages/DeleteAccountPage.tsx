import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { ApiError } from '@/shared/api/problems'
import { scheduleEndSession } from '@/shared/auth'
import { Button } from '@/shared/ui/Button'
import { CheckboxField } from '@/shared/ui/CheckboxField'
import { PageHeader } from '@/shared/ui/PageHeader'
import { ErrorState } from '@/shared/ui/states'
import { TextField } from '@/shared/ui/TextField'
import { useDeleteAccount } from '../mutations'
import { deleteSchema, type DeleteForm } from '../schemas'

export function DeleteAccountPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const remove = useDeleteAccount()

  const form = useForm<DeleteForm>({
    resolver: zodResolver(deleteSchema),
    defaultValues: { password: '', confirm: false },
  })
  const { errors } = form.formState
  const message = (key?: string) => (key ? t(key as 'validation.required') : undefined)

  const onSubmit = form.handleSubmit((values) =>
    remove.mutate(values.password, {
      // The account no longer exists: leave /app and close the session once home is on screen.
      onSuccess: () => {
        scheduleEndSession()
        void navigate('/', { replace: true, state: { notice: 'accountDeleted' } })
      },
      onError: (error) => {
        if (error instanceof ApiError && error.code === 'INVALID_CREDENTIALS') {
          form.setError('password', { message: 'account.delete.wrongPassword' })
          form.resetField('password', { keepError: true })
        }
      },
    }),
  )

  const generalError = remove.error instanceof ApiError && remove.error.code !== 'INVALID_CREDENTIALS'
    ? remove.error : null

  return (
    <section>
      <PageHeader title={t('pages.deleteAccount')}>
        <p role="note">{t('account.delete.warning')}</p>
        <p>{t('account.delete.webOnly')}</p>
      </PageHeader>
      <form onSubmit={(e) => void onSubmit(e)} noValidate data-form="delete-account">
        <TextField
          label={t('account.delete.password')}
          type="password"
          autoComplete="current-password"
          maxLength={72}
          error={message(errors.password?.message)}
          {...form.register('password')}
        />
        <CheckboxField
          label={t('account.delete.confirm')}
          error={message(errors.confirm?.message)}
          {...form.register('confirm')}
        />
        {generalError && <ErrorState error={generalError} />}
        <Button type="submit" variant="danger" loading={remove.isPending}>
          {remove.isPending ? t('account.delete.deleting') : t('account.delete.submit')}
        </Button>
      </form>
    </section>
  )
}