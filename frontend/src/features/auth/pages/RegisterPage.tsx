import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import type { ErrorCode } from '@/shared/api/problems'
import { register as createAccount, useSession } from '@/shared/auth'
import { Button } from '@/shared/ui/Button'
import { CheckboxField } from '@/shared/ui/CheckboxField'
import { PageHeader } from '@/shared/ui/PageHeader'
import { TextField } from '@/shared/ui/TextField'
import { AuthShell } from '../components/AuthShell'
import { nextPath } from '../nextPath'
import { registerSchema, type RegisterFormInput, type RegisterFormOutput } from '../schemas'
import { applyServerErrors } from '../serverErrors'
import css from '../auth.module.css'

export function RegisterPage() {
  const { t } = useTranslation()
  const { status } = useSession()
  const location = useLocation()
  const navigate = useNavigate()
  const next = nextPath(location.search)
  const [failure, setFailure] = useState<ErrorCode | null>(null)

  const form = useForm<RegisterFormInput, unknown, RegisterFormOutput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', username: '', password: '', confirmPassword: '', acceptedPrivacyNotice: false },
  })
  const { errors, isSubmitting } = form.formState
  const message = (key?: string) => (key ? t(key as 'validation.required') : undefined)

  const onSubmit = form.handleSubmit(async (values) => {
    setFailure(null)
    try {
      await createAccount({
        email: values.email.toLowerCase(),
        username: values.username,
        password: values.password,
        acceptedPrivacyNotice: true,
      })
      await navigate(next, { replace: true })
    } catch (error) {
      setFailure(applyServerErrors(error, form.setError, ['email', 'username', 'password', 'acceptedPrivacyNotice']))
    }
  })

  if (status === 'authenticated' && !isSubmitting) return <Navigate to={next} replace />

  return (
    <section>
      <AuthShell mode="register">
      <PageHeader title={t('pages.register')} eyebrow={t('nav.myAccount')} />
      <form onSubmit={(e) => void onSubmit(e)} noValidate data-form="register" className={css.form}>
        <TextField
          label={t('auth.email')}
          type="email"
          autoComplete="email"
          maxLength={254}
          error={message(errors.email?.message)}
          {...form.register('email')}
        />
        <TextField
          label={t('auth.username')}
          autoComplete="username"
          maxLength={20}
          hint={t('auth.usernameHint')}
          error={message(errors.username?.message)}
          {...form.register('username')}
        />
        <TextField
          label={t('auth.password')}
          type="password"
          autoComplete="new-password"
          maxLength={72}
          hint={t('auth.passwordHint')}
          error={message(errors.password?.message)}
          {...form.register('password')}
        />
        <TextField
          label={t('auth.confirmPassword')}
          type="password"
          autoComplete="new-password"
          maxLength={72}
          error={message(errors.confirmPassword?.message)}
          {...form.register('confirmPassword')}
        />
        <CheckboxField
          label={t('auth.privacy')}
          error={message(errors.acceptedPrivacyNotice?.message)}
          {...form.register('acceptedPrivacyNotice')}
        />
        <p className={css.legalLink}>{t('studio.legal.simplifiedAccount')} <Link to="/privacidad" target="_blank">{t('studio.legal.read')}</Link></p>
        {failure && (
          <p role="alert" data-testid="auth-error" className={css.alert}>
            <TriangleAlert size={18} aria-hidden="true" />{t(`errors.${failure}`)}
          </p>
        )}
        <Button type="submit" variant="promise" loading={isSubmitting}>
          {isSubmitting ? t('auth.register.sending') : t('auth.register.submit')}
        </Button>
      </form>
      <p className={css.switch}>
        {t('auth.register.hasAccount')}{' '}
        <Link to={`/login${location.search}`}>{t('auth.register.toLogin')}</Link>
      </p>
      </AuthShell>
    </section>
  )
}