import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import type { ErrorCode } from '@/shared/api/problems'
import { login, useSession } from '@/shared/auth'
import { Button } from '@/shared/ui/Button'
import { PageHeader } from '@/shared/ui/PageHeader'
import { TextField } from '@/shared/ui/TextField'
import { AuthShell } from '../components/AuthShell'
import { nextPath } from '../nextPath'
import { loginSchema, type LoginFormInput, type LoginFormOutput } from '../schemas'
import { applyServerErrors } from '../serverErrors'
import css from '../auth.module.css'

export function LoginPage() {
  const { t } = useTranslation()
  const { status } = useSession()
  const location = useLocation()
  const navigate = useNavigate()
  const next = nextPath(location.search)
  const [failure, setFailure] = useState<ErrorCode | null>(null)

  const form = useForm<LoginFormInput, unknown, LoginFormOutput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })
  const { errors, isSubmitting } = form.formState
  const message = (key?: string) => (key ? t(key as 'validation.required') : undefined)

  const onSubmit = form.handleSubmit(async (values) => {
    setFailure(null)
    try {
      await login({ email: values.email.toLowerCase(), password: values.password })
      await navigate(next, { replace: true })
    } catch (error) {
      setFailure(applyServerErrors(error, form.setError, ['email', 'password']))
      form.resetField('password')
    }
  })

  // Someone with a session who opens /login (back button, bookmark) goes straight on.
  if (status === 'authenticated' && !isSubmitting) return <Navigate to={next} replace />

  return (
    <section>
      <AuthShell mode="login">
      <PageHeader title={t('pages.login')} eyebrow={t('nav.myAccount')} />
      <form onSubmit={(e) => void onSubmit(e)} noValidate data-form="login" className={css.form}>
        <TextField
          label={t('auth.email')}
          type="email"
          autoComplete="email"
          maxLength={254}
          error={message(errors.email?.message)}
          {...form.register('email')}
        />
        <TextField
          label={t('auth.password')}
          type="password"
          autoComplete="current-password"
          maxLength={72}
          error={message(errors.password?.message)}
          {...form.register('password')}
        />
        {failure && (
          <p role="alert" data-testid="auth-error" className={css.alert}>
            <TriangleAlert size={18} aria-hidden="true" />{t(`errors.${failure}`)}
          </p>
        )}
        <Button type="submit" loading={isSubmitting}>
          {isSubmitting ? t('auth.login.sending') : t('auth.login.submit')}
        </Button>
      </form>
      <p className={css.switch}>
        {t('auth.login.noAccount')}{' '}
        <Link to={`/register${location.search}`}>{t('auth.login.toRegister')}</Link>
      </p>
      </AuthShell>
    </section>
  )
}