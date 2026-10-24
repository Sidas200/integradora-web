import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { ApiError } from '@/shared/api/problems'
import { Button } from '@/shared/ui/Button'
import { formatLongDate } from '@/shared/ui/formatDate'
import { PageHeader } from '@/shared/ui/PageHeader'
import { ErrorState, Skeleton } from '@/shared/ui/states'
import { TextField } from '@/shared/ui/TextField'
import { useRename } from '../mutations'
import { accountQuery } from '../queries'
import { profileSchema, type ProfileForm } from '../schemas'

export function ProfilePage() {
  const { t } = useTranslation()
  const q = useQuery(accountQuery())
  const rename = useRename()

  // `values` keeps the field in sync with the server copy (first load and after saving).
  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: q.data ? { username: q.data.username } : undefined,
  })
  const { errors } = form.formState

  const onSubmit = form.handleSubmit((values) =>
    rename.mutate(values.username, {
      onError: (error) => {
        if (error instanceof ApiError && (error.code === 'USERNAME_IN_USE' || error.code === 'VALIDATION_FAILED')) {
          form.setError('username', {
            message: error.code === 'USERNAME_IN_USE' ? 'errors.USERNAME_IN_USE' : 'validation.username',
          })
        }
      },
    }),
  )

  const generalError = rename.error instanceof ApiError
    && !['USERNAME_IN_USE', 'VALIDATION_FAILED'].includes(rename.error.code) ? rename.error : null

  return (
    <section>
      <PageHeader title={t('pages.profile')} />
      {q.isPending && <Skeleton rows={3} />}
      {q.isError && <ErrorState error={q.error} onRetry={() => void q.refetch()} />}
      {q.isSuccess && (
        <>
          <dl data-list="profile">
            <dt>{t('account.profile.email')}</dt>
            <dd>{q.data.email}</dd>
            <dt>{t('account.profile.memberSince')}</dt>
            <dd>{formatLongDate(q.data.createdAt)}</dd>
          </dl>
          <p>{t('account.profile.emailHint')}</p>

          <form onSubmit={(e) => void onSubmit(e)} noValidate data-form="profile">
            <TextField
              label={t('account.profile.username')}
              autoComplete="username"
              maxLength={20}
              hint={t('account.profile.usernameHint')}
              error={errors.username?.message ? t(errors.username.message as 'validation.username') : undefined}
              {...form.register('username')}
            />
            {generalError && <ErrorState error={generalError} />}
            <Button type="submit" loading={rename.isPending}>
              {rename.isPending ? t('account.profile.saving') : t('account.profile.save')}
            </Button>
          </form>
          {rename.isSuccess && <p role="status">{t('account.profile.saved')}</p>}
        </>
      )}
    </section>
  )
}