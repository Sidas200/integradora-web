import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui/Button'
import { CheckboxField } from '@/shared/ui/CheckboxField'
import { formatLongDate } from '@/shared/ui/formatDate'
import { PageHeader } from '@/shared/ui/PageHeader'
import { SelectField } from '@/shared/ui/SelectField'
import { ErrorState, Skeleton } from '@/shared/ui/states'
import { TextField } from '@/shared/ui/TextField'
import { useSaveSettings } from '../mutations'
import { settingsQuery } from '../queries'
import { settingsSchema, type SettingsForm } from '../schemas'

export function SettingsPage() {
  const { t } = useTranslation()
  const q = useQuery(settingsQuery())
  const save = useSaveSettings()

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    values: q.data
      ? { musicVolume: q.data.musicVolume, sfxVolume: q.data.sfxVolume, language: q.data.language, fullscreen: q.data.fullscreen }
      : undefined,
  })
  const { errors } = form.formState
  const message = (key?: string) => (key ? t(key as 'validation.volume') : undefined)
  const [music, sfx] = useWatch({ control: form.control, name: ['musicVolume', 'sfxVolume'] })

  // Controls are edited only in the game; they travel back untouched so PUT does not erase them.
  const onSubmit = form.handleSubmit((values) => {
    if (q.data) save.mutate({ ...values, controls: q.data.controls })
  })

  const controls = Object.entries(q.data?.controls ?? {})

  return (
    <section>
      <PageHeader title={t('pages.settings')}>
        <p>{t('account.settings.intro')}</p>
      </PageHeader>
      {q.isPending && <Skeleton rows={4} />}
      {q.isError && <ErrorState error={q.error} onRetry={() => void q.refetch()} />}
      {q.isSuccess && (
        <>
          <form onSubmit={(e) => void onSubmit(e)} noValidate data-form="settings">
            <TextField
              label={t('account.settings.musicVolume')}
              type="range"
              min={0}
              max={100}
              step={1}
              hint={`${music ?? 0} %`}
              error={message(errors.musicVolume?.message)}
              {...form.register('musicVolume', { valueAsNumber: true })}
            />
            <TextField
              label={t('account.settings.sfxVolume')}
              type="range"
              min={0}
              max={100}
              step={1}
              hint={`${sfx ?? 0} %`}
              error={message(errors.sfxVolume?.message)}
              {...form.register('sfxVolume', { valueAsNumber: true })}
            />
            <SelectField
              label={t('account.settings.language')}
              options={[
                { value: 'es', label: t('subscribe.languages.es') },
                { value: 'en', label: t('subscribe.languages.en') },
              ]}
              {...form.register('language')}
            />
            <CheckboxField label={t('account.settings.fullscreen')} {...form.register('fullscreen')} />
            {save.isError && <ErrorState error={save.error} />}
            <Button type="submit" loading={save.isPending}>
              {save.isPending ? t('account.settings.saving') : t('account.settings.save')}
            </Button>
          </form>
          {save.isSuccess && <p role="status">{t('account.settings.saved')}</p>}

          <h2>{t('account.settings.controls')}</h2>
          <p>{t('account.settings.controlsHint')}</p>
          {controls.length === 0 ? (
            <p>{t('account.settings.noControls')}</p>
          ) : (
            <dl data-list="controls">
              {controls.map(([action, binding]) => (
                <div key={action}>
                  <dt>{action}</dt>
                  <dd><kbd>{binding}</kbd></dd>
                </div>
              ))}
            </dl>
          )}
          {q.data.updatedAt && <p>{t('account.settings.updatedAt', { date: formatLongDate(q.data.updatedAt) })}</p>}
        </>
      )}
    </section>
  )
}