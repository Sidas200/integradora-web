import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { CalendarDays, CheckCircle2, Mail, PenLine } from 'lucide-react'
import { ApiError } from '@/shared/api/problems'
import { useReadOnly } from '@/shared/auth'
import { Button } from '@/shared/ui/Button'
import { formatLongDate } from '@/shared/ui/formatDate'
import { PageHeader } from '@/shared/ui/PageHeader'
import { ErrorState, Skeleton } from '@/shared/ui/states'
import { TextField } from '@/shared/ui/TextField'
import { useRename } from '../mutations'
import { accountQuery } from '../queries'
import { profileSchema, type ProfileForm } from '../schemas'
import css from '../account.module.css'

export function ProfilePage() {
  const { t } = useTranslation()
  const q = useQuery(accountQuery())
  const rename = useRename()
  const readOnly = useReadOnly()

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
      {q.data === undefined && (q.isError
        ? <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        : <Skeleton rows={3} />)}
      {q.data && (
        <div className={css.columns}>
          <div className={`${css.panel} ${css.idCard}`}>
            <div className={css.avatar} aria-hidden="true">
              <span>{q.data.username.slice(0, 1).toUpperCase()}</span>
            </div>
            <p className={css.idName} aria-hidden="true">{q.data.username}</p>
            <dl data-list="profile" className={css.idFacts}>
              <div>
                <dt><Mail size={14} aria-hidden="true" />{t('account.profile.email')}</dt>
                <dd>{q.data.email}</dd>
              </div>
              <div>
                <dt><CalendarDays size={14} aria-hidden="true" />{t('account.profile.memberSince')}</dt>
                <dd>{formatLongDate(q.data.createdAt)}</dd>
              </div>
            </dl>
            <p className={css.hint}>{t('account.profile.emailHint')}</p>
          </div>

          <div className={css.panel}>
            <h2 className={css.panelTitle}><span className={css.panelIcon} aria-hidden="true"><PenLine size={18} /></span>{t('account.profile.username')}</h2>
            <form onSubmit={(e) => void onSubmit(e)} noValidate data-form="profile" className={css.form}>
              <TextField
                label={t('account.profile.username')}
                autoComplete="username"
                maxLength={20}
                hint={t('account.profile.usernameHint')}
                error={errors.username?.message ? t(errors.username.message as 'validation.username') : undefined}
                {...form.register('username')}
              />
              {generalError && <ErrorState error={generalError} />}
              <Button type="submit" loading={rename.isPending} disabled={readOnly}>
                {rename.isPending ? t('account.profile.saving') : t('account.profile.save')}
              </Button>
            </form>
            {rename.isSuccess && <p role="status" className={css.saved}><CheckCircle2 size={16} aria-hidden="true" />{t('account.profile.saved')}</p>}
          </div>
        </div>
      )}
    </section>
  )
}